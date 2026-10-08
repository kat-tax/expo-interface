import type {RefObject} from 'react';
import {useCallback, useEffectEvent, useLayoutEffect, useRef, useState} from 'react';

/**
 * The units of a windowed list that are drawn: a row of the `List`, a row
 * of cells of the `CardGrid`. All lengths are in CSS pixels.
 */
export interface WindowRange {
  /** The first unit drawn. */
  first: number;
  /** One past the last unit drawn. */
  end: number;
  /** The room of the units before `first`, each with the gap after it. */
  before: number;
  /** The room of the units from `end` on, each with the gap before it. */
  after: number;
}

/** How many viewports are drawn beyond each edge of what shows. */
export const OVERSCAN = 1;

/**
 * How far down the units are drawn before anything is measured: the static
 * page, the first client render and a list that is hidden. It depends on the
 * props alone, so the server and the client draw the same units.
 */
export const INITIAL_SPAN = 1200;

/**
 * The units that cover `from` to `to`, measured from the top of the first
 * unit, given every unit's height and the gap between two units. At least one
 * unit is drawn: the last one when the span is past the end, the first one
 * when it is above the start.
 */
export function rangeOf(heights: readonly number[], gap: number, from: number, to: number): WindowRange {
  const count = heights.length;
  if (count === 0) return {first: 0, end: 0, before: 0, after: 0};
  let first = 0;
  let before = 0;
  // The first unit whose bottom is past `from`, or the last unit.
  while (first < count - 1 && before + heights[first]! <= from) {
    before += heights[first]! + gap;
    first++;
  }
  let end = first + 1;
  let next = before + heights[first]! + gap;
  // Every unit whose top is above `to`.
  while (end < count && next < to) {
    next += heights[end]! + gap;
    end++;
  }
  let after = 0;
  for (let index = end; index < count; index++) after += heights[index]! + gap;
  return {first, end, before, after};
}

/** What a windowed list is told about its units. */
export interface WindowOptions {
  /** One key per unit, in order: what a measured height is kept under. */
  keys: readonly string[];
  /** A unit's height before it has been measured. */
  estimate: number;
  /** The space between two units. */
  gap: number;
}

/** What a windowed list draws with. */
export interface Windowed {
  /** The units to draw, and the room of the rest. */
  range: WindowRange;
  /**
   * Whether `range` comes from the list as the page lays it out: false
   * before the page has been read and while the list is hidden, when the
   * first units are drawn whatever shows. Where there is no
   * `ResizeObserver` the first units count as read, since nothing reads the
   * page before a scroll.
   */
  measured: boolean;
  /** The spacer before the drawn units, where the first unit's top would be. */
  start: RefObject<HTMLDivElement | null>;
  /**
   * The ref of a drawn unit's element, which carries its key in
   * `data-window-key`: its height is measured while it is drawn.
   */
  measure: (element: HTMLElement | null) => () => void;
}

/**
 * The part of the list the window shows, from the first unit's top, whether
 * it was read from the list as laid out, and every height measured so far.
 */
interface View {
  from: number;
  to: number;
  measured: boolean;
  heights: ReadonlyMap<string, number>;
}

/** The heights with what the observer reported for the units among `entries`; the same map when nothing changed. */
function withSizes(heights: ReadonlyMap<string, number>, entries: readonly ResizeObserverEntry[]): ReadonlyMap<string, number> {
  let next: Map<string, number> | null = null;
  for (const entry of entries) {
    // The list's own box carries no key: it reports a resize, not a unit.
    const key = (entry.target as HTMLElement).dataset.windowKey;
    if (key == null) continue;
    const size = entry.borderBoxSize[0]!.blockSize;
    if ((next ?? heights).get(key) === size) continue;
    next ??= new Map(heights);
    next.set(key, size);
  }
  return next ?? heights;
}

function same(a: WindowRange, b: WindowRange): boolean {
  return a.first === b.first && a.end === b.end && a.before === b.before && a.after === b.after;
}

/**
 * Draws only the units of a list near the view: the ones inside the part of
 * `scroller` the window shows, and a viewport more on each side. The units
 * before and after are spacers of their room, at the height each unit was
 * measured at once drawn and at `estimate` before.
 *
 * The range is worked out in render from the data, the heights and the part
 * of the list the window shows, so new data, a new estimate or new columns
 * are drawn at once. That part is read from the page on any scroll (the
 * list's own or an ancestor's, so a list the page scrolls is windowed too),
 * on a resize of the window or of the list, and whenever a drawn unit changes
 * height or keeps its element under a new key; it is kept only when it
 * changes which units are drawn. Until the page has been read, and while the
 * list is hidden, the first units are drawn and the range is not `measured`,
 * so a list does not take its end from them. The spacers are never scroll
 * anchors, so the browser keeps the drawn units still while a spacer changes.
 */
export function useWindowed(scroller: RefObject<HTMLElement | null>, {keys, estimate, gap}: WindowOptions): Windowed {
  const [view, setView] = useState<View>(() => ({from: 0, to: INITIAL_SPAN, measured: typeof ResizeObserver === 'undefined', heights: new Map()}));
  const start = useRef<HTMLDivElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  // Each drawn unit's element, and the key it was last observed under.
  const mounted = useRef(new Map<HTMLElement, string | undefined>());
  const rangeIn = (heights: ReadonlyMap<string, number>, from: number, to: number) => (
    rangeOf(keys.map(key => heights.get(key) ?? estimate), gap, from, to)
  );
  const range = rangeIn(view.heights, view.from, view.to);

  const follow = useEffectEvent((entries: readonly ResizeObserverEntry[]) => {
    // The element is attached by the time an effect runs.
    const box = scroller.current!.getBoundingClientRect();
    const startTop = start.current?.getBoundingClientRect().top;
    // Hidden, not laid out, or showing its empty content: the first units.
    const measured = box.height > 0 && startTop != null;
    let from = 0;
    let to = INITIAL_SPAN;
    if (measured) {
      // What shows of the list: its box, clipped by the window.
      const clipTop = Math.max(box.top, 0);
      const clipBottom = Math.min(box.bottom, globalThis.innerHeight);
      const reach = Math.max(clipBottom - clipTop, 0) * OVERSCAN;
      from = clipTop - startTop - reach;
      to = clipBottom - startTop + reach;
    }
    setView(current => {
      const heights = withSizes(current.heights, entries);
      const unchanged = heights === current.heights && measured === current.measured;
      if (unchanged && same(rangeIn(heights, from, to), rangeIn(heights, current.from, current.to))) return current;
      return {from, to, measured, heights};
    });
  });

  useLayoutEffect(() => {
    const onChange = () => follow([]);
    document.addEventListener('scroll', onChange, {capture: true, passive: true});
    globalThis.addEventListener('resize', onChange);
    if (typeof ResizeObserver !== 'undefined') {
      // It reports every element it is given once at the start, so the
      // list reads the page as soon as it is laid out.
      const resize = new ResizeObserver(entries => follow(entries));
      resize.observe(scroller.current!);
      // The units drawn so far attached their refs before this effect ran.
      for (const element of mounted.current.keys()) resize.observe(element);
      observer.current = resize;
    }
    return () => {
      document.removeEventListener('scroll', onChange, true);
      globalThis.removeEventListener('resize', onChange);
      observer.current?.disconnect();
      observer.current = null;
    };
  }, [scroller]);

  // An element can stay drawn while its key changes: a grid's first cell
  // when the columns are counted again. The observer reports an element when
  // it starts observing it and then only when its size changes, so an element
  // under a new key is observed again, and its height is kept under that key.
  useLayoutEffect(() => {
    const resize = observer.current;
    if (resize == null) return;
    for (const [element, key] of mounted.current) {
      if (element.dataset.windowKey === key) continue;
      mounted.current.set(element, element.dataset.windowKey);
      resize.unobserve(element);
      resize.observe(element);
    }
  });

  const measure = useCallback((attached: HTMLElement | null) => {
    // A ref that returns its cleanup is called with its element alone.
    const element = attached!;
    mounted.current.set(element, element.dataset.windowKey);
    observer.current?.observe(element);
    return () => {
      mounted.current.delete(element);
      observer.current?.unobserve(element);
    };
  }, []);

  return {range, measured: view.measured, start, measure};
}

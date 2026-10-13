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

/** How many heights of what shows are drawn beyond each of its edges. */
export const OVERSCAN = 1;

/**
 * How far down the units are drawn before anything is measured: the static
 * page, the first client render, a list that is hidden and one wholly
 * outside the window. It depends on the props alone, so the server and the
 * client draw the same units.
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
   * before the page has been read, while the list is hidden and while it
   * lies wholly outside the window, when the first units are drawn whatever
   * shows. Where there is no `ResizeObserver` the first units count as read,
   * since nothing reads the page before a scroll.
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
 * The part of the list that shows, from the first unit's top, whether it was
 * read from the list as laid out, and every height measured so far.
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

/** The `overflow-y` values of a box that clips what overflows it: all but `visible`. */
const CLIPPING = new Set(['auto', 'scroll', 'hidden', 'clip']);

/**
 * The top and the bottom, in the window, of what shows of `box`, the box of
 * `element`: the part of it inside every box around it that clips its
 * overflow (a scroll view, a capped sheet body, a box with `overflow:
 * hidden`) and inside the window. The boxes around it are read again on
 * every read, with their rects, to keep it simple: a read lays the page out
 * already, and what is around the list can change between two reads.
 *
 * The walk ends below the body: CSS hands the root's overflow and the body's
 * to the window, which clips last anyway, while the body's own box can
 * scroll away with the page. It ends at a fixed box too, once that box has
 * clipped: the window places a fixed box (a modal dialog, a popover, a
 * drawer), so the boxes around it clip nothing of it.
 */
function shownOf(element: HTMLElement, box: DOMRect): {clipTop: number; clipBottom: number} {
  let clipTop = Math.max(box.top, 0);
  let clipBottom = Math.min(box.bottom, globalThis.innerHeight);
  for (let around = element.parentElement; around != null && around !== document.body; around = around.parentElement) {
    const style = getComputedStyle(around);
    if (CLIPPING.has(style.overflowY)) {
      const rect = around.getBoundingClientRect();
      clipTop = Math.max(clipTop, rect.top);
      clipBottom = Math.min(clipBottom, rect.bottom);
    }
    if (style.position === 'fixed') break;
  }
  return {clipTop, clipBottom};
}

/**
 * Draws only the units of a list near the view: the ones inside the part of
 * `scroller` that shows, inside the window and inside every box around it
 * that clips its overflow, and as much again on each side. The units
 * before and after are spacers of their room, at the height each unit was
 * measured at once drawn and at `estimate` before.
 *
 * The range is worked out in render from the data, the heights and the part
 * of the list that shows, so new data, a new estimate or new columns
 * are drawn at once. That part is read from the page on any scroll (the
 * list's own or an ancestor's, so a list the page scrolls is windowed too),
 * on a resize of the window or of the list, when a CSS transition or
 * animation ends anywhere in the document (a sheet's drawer slides in by a
 * transform, which none of the others report), and whenever a drawn unit
 * changes height or keeps its element under a new key; it is kept only when
 * it changes which units are drawn. Until the page has been read, while the
 * list is hidden, and while it lies wholly outside the window (the drawer
 * still on its way in), the first units are drawn and the range is not
 * `measured`, so a list does not take its end from them and a list that
 * arrives later has rows to show. The spacers are never scroll anchors, so
 * the browser keeps the drawn units still while a spacer changes.
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
    const element = scroller.current!;
    const box = element.getBoundingClientRect();
    const startTop = start.current?.getBoundingClientRect().top;
    // Hidden, not laid out, showing its empty content, or wholly above or
    // below the window: the first units. Clipped by the window, a box
    // outside it would hold one unit, and nothing would show once it slid in.
    const measured = box.height > 0 && startTop != null && box.bottom > 0 && box.top < globalThis.innerHeight;
    let from = 0;
    let to = INITIAL_SPAN;
    if (measured) {
      // What shows of the list: its box, clipped by the boxes around it and
      // by the window. A part of no height (the list scrolled out of a body
      // that scrolls) holds one unit, and the next scroll reads it again.
      const {clipTop, clipBottom} = shownOf(element, box);
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
    // A transform moves the list without a scroll, a resize or a report
    // from the observer: the page is read again when a transition or an
    // animation ends anywhere in it, which is cheap, since a read that
    // changes nothing sets nothing.
    document.addEventListener('transitionend', onChange, {capture: true});
    document.addEventListener('animationend', onChange, {capture: true});
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
      document.removeEventListener('transitionend', onChange, true);
      document.removeEventListener('animationend', onChange, true);
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

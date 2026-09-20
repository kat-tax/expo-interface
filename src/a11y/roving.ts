import type {KeyboardEvent, RefObject} from 'react';
import {useCallback, useRef} from 'react';

/**
 * The keyboard contract behind a composite ARIA role, on web.
 *
 * A `menu`, a `radiogroup`, a `tablist` and a `toolbar` all promise the same
 * thing to anyone using a keyboard: the group is **one** stop in the tab order,
 * and the arrow keys move within it. Declaring the role without keeping that
 * promise is worse than using plain buttons, because a screen reader announces
 * a pattern the control does not implement — and no linter can see it, because
 * axe reads static semantics and never presses a key.
 *
 * Nothing like this is needed on iOS, Android or Windows: there the kit renders
 * the platform's own control, which already behaves. This is the one place the
 * behaviour has to be written down, which is why it is a hook here rather than
 * a dependency.
 *
 * Items are found in the DOM by the attribute `itemProps` puts on them, so
 * there is no registration to keep in sync with the render.
 */

/** How long a typeahead search stays open for the next keystroke. */
const TYPEAHEAD_MS = 600;

/** The attribute that marks an element as one of the group's items. */
const ITEM = 'data-roving-item';

export interface RovingFocusOptions {
  /**
   * Which arrows move the focus. `vertical` takes Up and Down (a menu),
   * `horizontal` takes Left and Right (a radio group laid out in a row).
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  /**
   * The item that holds the group's single tab stop. A radio group passes the
   * selected index, because that is the one a person tabbing in should land on.
   * @default 0
   */
  activeIndex?: number;
  /**
   * Whether moving past an end comes back round at the other.
   * @default true
   */
  wrap?: boolean;
  /**
   * Called with the index focus moved to. A radio group selects on move, which
   * is what its pattern asks for; a menu only moves.
   */
  onMove?: (index: number) => void;
  /**
   * Whether typing jumps to the next item whose label starts with what was
   * typed. Worth having on a long menu, pointless on three segments.
   * @default false
   */
  typeahead?: boolean;
}

export interface RovingFocus {
  /** Attach to the element that holds the items: the arrow, Home and End keys. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Spread onto each item, in render order. */
  itemProps: (index: number) => {tabIndex: 0 | -1; [ITEM]: ''};
}

/** Whether an item can take the focus, by either of the ways it can be off. */
function enabled(item: HTMLElement): boolean {
  return !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true';
}

/** The group's items, in the order they are drawn. */
export function itemsOf(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return [...container.querySelectorAll<HTMLElement>(`[${ITEM}]`)];
}

/**
 * The next item that can take the focus, `delta` away from `from`, skipping
 * the disabled ones. `-1` when there is nowhere to go — an empty group, or the
 * end of a group that does not wrap.
 */
export function step(items: HTMLElement[], from: number, delta: number, wrap: boolean): number {
  const count = items.length;
  // Walk at most once round, so a group of nothing but disabled items ends.
  for (let tried = 1; tried <= count; tried++) {
    let next = from + delta * tried;
    if (next < 0 || next >= count) {
      if (!wrap) return -1;
      next = ((next % count) + count) % count;
    }
    if (enabled(items[next]!)) return next;
  }
  return -1;
}

/**
 * What a screen reader would announce for an element: its `aria-label` if it
 * has one, else its text with the parts hidden from assistive technology left
 * out. The same rule the harness builds its tree with, so typing in a menu
 * finds what a test would find by name.
 *
 * This matters more than it sounds. The kit draws an icon as a Material
 * Symbols *ligature* — the glyph's own name as text — which is why the span is
 * `aria-hidden`. Matching raw `textContent` would make `d` find the `delete`
 * glyph beside "Rename" rather than the entry called "Delete".
 */
export function visibleText(node: Node): string {
  // A text node's content is always a string, however the DOM types read.
  if (node.nodeType === Node.TEXT_NODE) return node.textContent!;
  // Anything else in the tree — a comment React left behind — says nothing.
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const element = node as HTMLElement;
  if (element.getAttribute('aria-hidden') === 'true') return '';
  return element.getAttribute('aria-label') ?? [...element.childNodes].map(visibleText).join('');
}

/**
 * The first item at or after `from` whose name begins with `text`, wrapping
 * once. `-1` when nothing matches, in which case the keystroke is left alone
 * rather than swallowed.
 */
export function search(items: HTMLElement[], from: number, text: string): number {
  const needle = text.toLowerCase();
  for (let tried = 1; tried <= items.length; tried++) {
    const next = (from + tried) % items.length;
    const item = items[next]!;
    if (enabled(item) && visibleText(item).trim().toLowerCase().startsWith(needle)) return next;
  }
  return -1;
}

/**
 * @param container the element the items live under, which the caller already
 * has a ref to — so there is no ref to merge onto an element that has one.
 */
export function useRovingFocus(
  container: RefObject<HTMLElement | null>,
  {orientation = 'vertical', activeIndex = 0, wrap = true, onMove, typeahead = false}: RovingFocusOptions = {},
): RovingFocus {
  // A search stays open for a moment so `de` finds "Delete" rather than two
  // separate jumps to the first D and the first E. Held as a time rather than a
  // timer: nothing to cancel when the menu closes mid-word.
  const typed = useRef({text: '', at: 0});

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const items = itemsOf(container.current);
      if (items.length === 0) return;
      const from = items.indexOf(document.activeElement as HTMLElement);
      const forward = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const backward = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

      let next = -1;
      if (event.key === forward) next = step(items, from, 1, wrap);
      else if (event.key === backward) next = step(items, from, -1, wrap);
      // From before the start and past the end, so Home lands on the first item
      // that can take focus and End on the last.
      else if (event.key === 'Home') next = step(items, -1, 1, false);
      else if (event.key === 'End') next = step(items, items.length, -1, false);
      else if (typeahead && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const now = Date.now();
        const text = now - typed.current.at > TYPEAHEAD_MS ? event.key : typed.current.text + event.key;
        typed.current = {text, at: now};
        // The same letter over and over means "the next one starting with it",
        // so it cycles through them; a real word searches from where the focus
        // already is, so typing on refines the match rather than jumping past
        // the item the earlier letters just found.
        const repeat = [...text].every(character => character === text[0]);
        next = search(items, repeat ? from : from - 1, repeat ? text[0]! : text);
      } else return;

      if (next === -1) {
        // Arrowing at the end of a group that does not wrap is a no-op rather
        // than a scroll of the page behind it.
        if (event.key.startsWith('Arrow')) event.preventDefault();
        return;
      }
      event.preventDefault();
      items[next]!.focus();
      onMove?.(next);
    },
    [container, orientation, wrap, onMove, typeahead],
  );

  const itemProps = useCallback(
    (index: number) => ({tabIndex: (index === activeIndex ? 0 : -1) as 0 | -1, [ITEM]: '' as const}),
    [activeIndex],
  );

  return {onKeyDown, itemProps};
}

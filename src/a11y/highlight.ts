import {useEffect} from 'react';

/**
 * Marking the part of a label that a search matched, on web, without putting
 * anything into the DOM to do it.
 *
 * The CSS Custom Highlight API styles ranges directly: `CSS.highlights` holds
 * named sets of `Range`s, and `::highlight(name)` paints them. Nothing is
 * wrapped in a `<mark>`, which matters here for two reasons beyond tidiness —
 * the label is the same string the native platforms render through their own
 * text primitives, and a wrapper would change what the accessible name
 * computes to and what the harness reads out of the tree.
 *
 * Baseline since 2026 and an Interop 2026 focus area, but the API can be
 * absent (an older engine, jsdom) so every path here is guarded: without it the
 * label simply renders unmarked, which is what it did before.
 *
 * Only `color`, `background-color`, `text-decoration`, `text-shadow` and the
 * `-webkit-text-stroke` family apply to a highlight — enough to mark a match,
 * not enough to draw a pill. See `menu.css`.
 */

/** The name `::highlight()` paints under, shared by every menu on the page. */
export const MATCH_HIGHLIGHT = 'ui-match';

interface HighlightRegistry {
  set(name: string, highlight: unknown): void;
  delete(name: string): void;
}

interface HighlightApi {
  highlights?: HighlightRegistry;
}

/** The registry, or nothing where the engine has no Custom Highlight API. */
export function registry(): HighlightRegistry | null {
  if (typeof CSS === 'undefined') return null;
  return (CSS as unknown as HighlightApi).highlights ?? null;
}

/**
 * A range over the first case-insensitive occurrence of `query` inside an
 * element's own text, or nothing when it is not there.
 *
 * Only the first text node is considered, which is what a label is: a match
 * spanning an element boundary is not something a menu label does, and looking
 * for one would cost more than it is worth on every keystroke.
 */
export function matchRange(element: Element, query: string): Range | null {
  const text = element.firstChild;
  if (!text || text.nodeType !== Node.TEXT_NODE) return null;
  // A text node's content is always a string, however the DOM types read.
  const index = text.textContent!.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return null;
  const range = document.createRange();
  range.setStart(text, index);
  range.setEnd(text, index + query.length);
  return range;
}

/**
 * Paints `query` wherever it appears in the elements `selector` finds under
 * `container`, for as long as the query stands.
 *
 * @param container the element the labels live under.
 * @param query what was typed. Empty clears the highlight.
 * @param selector which elements hold a label.
 */
export function useMatchHighlight(
  container: {current: Element | null},
  query: string | undefined,
  selector: string,
): void {
  useEffect(() => {
    const highlights = registry();
    const search = query?.trim();
    if (!highlights || !search) return;
    const element = container.current;
    if (!element) return;
    const ranges: Range[] = [];
    for (const label of element.querySelectorAll(selector)) {
      const range = matchRange(label, search);
      if (range) ranges.push(range);
    }
    if (ranges.length === 0) return;
    // `Highlight` is a global the same API brings; if the registry is there so
    // is the constructor.
    highlights.set(MATCH_HIGHLIGHT, new (globalThis as unknown as {Highlight: new (...r: Range[]) => unknown}).Highlight(...ranges));
    return () => highlights.delete(MATCH_HIGHLIGHT);
  });
}

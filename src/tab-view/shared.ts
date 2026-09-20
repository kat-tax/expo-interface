import type {IconToken} from '../icons';
import type {TabViewLayout, TabViewTab} from './types';

/**
 * The width below which there is no strip, in points.
 *
 * 640 is both WinUI's compact breakpoint and the top of Android's compact
 * window class, and it is about where Safari and Chrome stop drawing a strip
 * on a tablet. One threshold rather than the three `Tabs` uses for its
 * navigation pane: a strip either fits or it does not.
 */
export const TAB_BREAKPOINT = 640;

/** The shape a `TabView` has settled on, once a width has decided it. */
export type ResolvedLayout = 'strip' | 'switcher';

/**
 * The shape a request comes out as at a width. A forced `strip` or `switcher`
 * is taken as given — a caller who has said which one wants that one at every
 * size.
 */
export function resolveLayout(layout: TabViewLayout, width: number): ResolvedLayout {
  if (layout !== 'auto') return layout;
  return width >= TAB_BREAKPOINT ? 'strip' : 'switcher';
}

/** Where a tab is in the strip, or `-1` for an id no tab has. */
export function tabIndex(tabs: readonly TabViewTab[], id: string): number {
  return tabs.findIndex(tab => tab.id === id);
}

/**
 * Which tab to open once `closing` has gone — the answer every consumer of
 * this component needs and most get wrong.
 *
 * Closing a tab that is not the open one changes nothing. Closing the open one
 * moves to the **next** tab, as every browser and editor does, and falls back
 * to the previous one when the last tab was closed. Closing the only tab
 * leaves nothing open and answers `undefined`.
 *
 * It is a function rather than behaviour inside the component because the kit
 * does not own the list: `tabs` and `selected` are the caller's, and a caller
 * that removes a tab has to decide this. Exported so that decision is made
 * once, here, with a test on it.
 */
export function nextSelection(
  tabs: readonly TabViewTab[],
  closing: string,
  selected: string,
): string | undefined {
  if (closing !== selected) return selected;
  const index = tabIndex(tabs, closing);
  // An id no tab has closes nothing, so nothing moves.
  if (index < 0) return selected;
  return (tabs[index + 1] ?? tabs[index - 1])?.id;
}

/**
 * What the switcher's button is called. The title alone would not say how many
 * other tabs pressing it reveals, and the count alone would not say which one
 * is open — a screen reader needs both, because the count is drawn as a bare
 * numeral that says nothing on its own.
 */
export function switcherLabel(tabs: readonly TabViewTab[], selected: string): string {
  const count = `${tabs.length} ${tabs.length === 1 ? 'tab' : 'tabs'}`;
  const open = tabs[tabIndex(tabs, selected)];
  return open ? `${open.title}, ${count}` : count;
}

/** What a tab's close cross is called, since a cross says nothing on its own. */
export function closeLabel(tab: TabViewTab): string {
  return `Close ${tab.title}`;
}

/** What the add button is called, wherever it is drawn. */
export const ADD_LABEL = 'New tab';

/** One glyph, drawn by whichever icon component the platform has — see `glyph.tsx`. */
export interface GlyphProps {
  icon: IconToken;
  size: number;
  tintColor?: string;
}

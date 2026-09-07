import type {ReactNode} from 'react';
import {createContext, useContext} from 'react';
import {inset} from '../theme';

/** True while the web tab bar floats over the screens — see {@link useTabBarInset}. */
export const TabBarContext = createContext(false);

/**
 * The space a floating tab bar takes at the top of the screen on web: what a
 * header under it has to leave clear. Zero on iOS and Android, where the tab
 * bar is the platform's own and sits at the bottom, and zero on web while the
 * bar is not drawn (`Tabs hidden`, with no header folded into it).
 */
export function useTabBarInset(): number {
  return useContext(TabBarContext) ? inset.topBar : 0;
}

/** True inside the web tab bar's own row — see {@link useInBar}. */
export const InBarContext = createContext(false);

/**
 * Whether this is drawn inside the web tab bar rather than in a header row of
 * its own: a header's trailing slot folded into the bar keeps the bar's
 * scale, since the bar is the height of its tabs.
 */
export function useInBar(): boolean {
  return useContext(InBarContext);
}

/** A screen's header, as the web tab bar draws it — see {@link HeaderSlot}. */
export interface WebHeader {
  /** The screen's title, in the bar's logo slot. */
  title: string;
  /** Set on a pushed screen: a back button before the title. */
  onBack?: () => void;
  /** The screen's `headerRight`, in the bar's actions slot. */
  trailing?: ReactNode;
}

/**
 * The web bar's header slot: a store outside React state, so a screen whose
 * title or trailing slot changes re-renders the bar alone rather than itself.
 * A header publishes into it; the bar subscribes.
 */
export interface HeaderSlot {
  /** Publishes a screen's header, or clears it (`null`) when the screen goes. */
  set(id: string, header: WebHeader | null): void;
  /** The header the bar draws, if a screen handed it one. */
  get(): WebHeader | null;
  subscribe(listener: () => void): () => void;
}

export const HeaderSlotContext = createContext<HeaderSlot | null>(null);

/**
 * The web tab bar's header slot, or `null` where there is no bar to fold a
 * header into: every native platform, a stack outside `Tabs`, and
 * `Tabs webFoldHeader={false}`.
 */
export function useHeaderSlot(): HeaderSlot | null {
  return useContext(HeaderSlotContext);
}

/**
 * Builds the slot for one `Tabs`. The last header to publish owns it, so a
 * header leaving after a newer one arrived — the screen behind the one just
 * pushed — clears nothing.
 */
export function createHeaderSlot(): HeaderSlot {
  let current: {id: string; header: WebHeader} | null = null;
  const listeners = new Set<() => void>();
  return {
    set(id, header) {
      if (header) current = {id, header};
      else if (current?.id === id) current = null;
      else return;
      for (const listener of listeners) listener();
    },
    get: () => current?.header ?? null,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Subscription of a bar with no slot of its own: nothing ever changes. */
export const noSubscription = () => () => {};

import type {ReactNode} from 'react';
import type {HeaderSearchSlot} from '../header-search/types';
import {createContext, useContext} from 'react';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFloatingHeader} from '../stack-header/context';
import {inset} from '../theme';

/** True while the web tab bar floats over the screens — see {@link useTabBarInset}. */
export const TabBarContext = createContext(false);

/**
 * Web: the height of the search row the tab bar has put under itself, for a
 * folded header whose search is `stacked`, and zero without one. The bar
 * floats over the screens, so what is under it pays this on top of the
 * bar's own inset — see {@link useTabBarInset}.
 */
export const FoldedSearchContext = createContext(0);

/**
 * The space a bar floating over the screen takes at its top: what content
 * passing under it (`Screen underBar`) pads itself by. On web it is the tab
 * bar's, while the bar is drawn (`Tabs hidden` with no header folded into it
 * draws none), plus the search row a folded header has put under the bar;
 * on iOS, where the tab bar is the platform's own and sits at the bottom, it
 * is the stack header's under a `TabStack` with a `material`, the status bar
 * included, and zero under an opaque one, which Android's header always is.
 */
export function useTabBarInset(): number {
  const bar = useContext(TabBarContext);
  const search = useContext(FoldedSearchContext);
  const floating = useFloatingHeader();
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') return bar ? inset.topBar + search : 0;
  return floating ? insets.top + inset.header : 0;
}

/** True inside the native tab bar's screens — see {@link useNativeTabs}. */
export const NativeTabsContext = createContext(false);

/**
 * Whether this is a screen of the platform's own tab bar (`Tabs` on iOS and
 * Android). Android's tab host keeps its screens above the navigation bar
 * itself, so a `Screen` there pays no bottom inset of its own: the safe-area
 * view measures from the host, not the window, and would pay it twice.
 */
export function useNativeTabs(): boolean {
  return useContext(NativeTabsContext);
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

/** True while the web tab bar is too narrow for its labels — see {@link useNarrowBar}. */
export const NarrowBarContext = createContext(false);

/**
 * Whether the web tab bar has dropped its labels for want of room (a phone's
 * width): the tabs show their icons alone, and a header control in the bar
 * with an icon of its own shows that alone too, its label kept as the
 * accessible name.
 */
export function useNarrowBar(): boolean {
  return useContext(NarrowBarContext);
}

/** A screen's header, as the web tab bar draws it — see {@link HeaderSlot}. */
export interface WebHeader {
  /**
   * A pushed screen's title, which takes the bar's logo slot along with the
   * back button beside it. Both are set together, or neither is: a tab's own
   * screen leaves the slot to `webLogo`, since its title is the tab next to
   * it and the bar would be saying it twice.
   */
  title?: string;
  /** Set on a pushed screen: a back button before the title. */
  onBack?: () => void;
  /** The screen's `headerRight`, in the bar's actions slot. */
  trailing?: ReactNode;
  /**
   * The screen's search (`HeaderSearch`): a frameless field in the logo slot
   * for `inline`, a magnifier in the actions slot for `action`, or a row
   * under the bar for `stacked`.
   */
  search?: HeaderSearchSlot;
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

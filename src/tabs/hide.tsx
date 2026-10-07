import {createContext, useCallback, useContext, useEffect, useId, useMemo, useState, useSyncExternalStore} from 'react';
import {useNavigation} from 'expo-router';

/** Where a screen asks for the tabs to be hidden while it is focused — see {@link HideTabs}. */
export interface TabsHider {
  set(id: string, hidden: boolean): void;
}

export const HideTabsContext = createContext<TabsHider | null>(null);

/** The tabs' own `hidden`, or hidden while a focused screen renders `HideTabs`. */
export function useHiddenTabs(hidden: boolean): {hider: TabsHider; hidden: boolean} {
  const [asking, setAsking] = useState<ReadonlySet<string>>(() => new Set());
  const hider = useMemo<TabsHider>(() => ({
    set(id, on) {
      setAsking(previous => {
        if (previous.has(id) === on) return previous;
        const next = new Set(previous);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    },
  }), []);
  return {hider, hidden: hidden || asking.size > 0};
}

/**
 * Hides the app's tabs while the screen it is rendered in is focused, and
 * shows them again when the screen goes or loses the focus: an open
 * document that takes the whole display, decided by the screen rather than
 * by the URL. `hidden={false}` lets go without unmounting. Under `Tabs` on
 * every platform, as `Tabs hidden` would: on web the bar stays while it
 * carries a pushed screen's header.
 */
export function HideTabs({hidden = true}: {hidden?: boolean}) {
  const hider = useContext(HideTabsContext);
  const focused = useFocused();
  const id = useId();
  useEffect(() => {
    hider?.set(id, hidden && focused);
  }, [hider, id, hidden, focused]);
  useEffect(() => () => hider?.set(id, false), [hider, id]);
  return null;
}

/**
 * Whether the screen is focused, read from its navigation object and its
 * focus and blur events rather than from `useIsFocused`. expo-router's
 * custom `Navigator`, which the kit's Windows tabs are built on, renders no
 * `NavigationContent`, so nothing under it provides the focused route, and
 * `useIsFocused` answers false in every screen it holds.
 */
function useFocused(): boolean {
  const navigation = useNavigation();
  const subscribe = useCallback((onChange: () => void) => {
    const focus = navigation.addListener('focus', onChange);
    const blur = navigation.addListener('blur', onChange);
    return () => {
      focus();
      blur();
    };
  }, [navigation]);
  const read = () => navigation.isFocused();
  return useSyncExternalStore(subscribe, read, read);
}

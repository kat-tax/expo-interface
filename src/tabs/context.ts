import {createContext, useContext} from 'react';
import {inset} from '../theme';

/** True while the web tab bar floats over the screens — see {@link useTabBarInset}. */
export const TabBarContext = createContext(false);

/**
 * The space a floating tab bar takes at the top of the screen on web: what a
 * header under it has to leave clear. Zero on iOS and Android, where the tab
 * bar is the platform's own and sits at the bottom, and zero on web while the
 * bar is hidden (`Tabs hidden`).
 */
export function useTabBarInset(): number {
  return useContext(TabBarContext) ? inset.topBar : 0;
}

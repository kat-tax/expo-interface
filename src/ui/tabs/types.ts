import type {Href} from 'expo-router';
import type {SFSymbol, AndroidSymbol} from 'expo-symbols';
import type {ReactNode} from 'react';

/**
 * Props for the tab bar component.
 * @see Tabs
 */
export interface TabBarProps {
  /** 
   * Configures the tab bar items for native & web.
   * @example
   * ```ts
   * const routes: readonly TabRoute[] = [
   *   {
   *     href: '/',
   *     name: 'index',
   *     label: 'Home',
   *     icon: {ios: 'house', android: 'home', web: 'home'},
   *   },
   *   {
   *     href: '/settings',
   *     name: 'settings',
   *     label: 'Settings',
   *     icon: {ios: 'gearshape', android: 'settings', web: 'settings'},
   *   },
   * ];
   * ```
   */
  routes: readonly TabRoute[];
  /**
   * Controls the web tab bar logo. Use a preset mode to show the app icon
   * and/or name, or pass a custom node to replace them entirely.
   * @default 'icon-and-text'
   */
  webLogo?: WebLogo;
}

export type WebLogo =
  | 'icon-only'
  | 'text-only'
  | 'icon-and-text'
  | ReactNode;

export interface TabRoute {
  /** Route segment, matching the file name in `src/app`. */
  name: string;
  /** Navigation target used by the web tab bar. */
  href: Href;
  /** Visible tab label. */
  label: string;
  /** Symbol name per platform. */
  icon: {
    ios: SFSymbol;
    android: AndroidSymbol;
    web: AndroidSymbol;
  };
}

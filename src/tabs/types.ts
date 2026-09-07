import type {Href} from 'expo-router';
import type {SFSymbol, AndroidSymbol} from 'expo-symbols';
import type {ReactNode} from 'react';
import type {ImageSource} from 'expo-image';

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
   * Hides the tab bar while keeping the routes, so a screen that needs the
   * whole display (an open document) can take it: natively the native tab
   * bar's own `hidden`, on web the floating bar is not drawn.
   * @default false
   */
  hidden?: boolean;
  /**
   * Controls the web tab bar logo. Use a preset mode to show the app icon
   * and/or name, or pass a custom node to replace them entirely. The slot
   * shrinks before the tabs do, so a title in it is bounded by the bar.
   * @default 'icon-and-text'
   */
  webLogo?: WebLogo;
  /**
   * App icon rendered by the `icon-only` and `icon-and-text` web logo presets,
   * e.g. `require('./assets/icon.png')`. When omitted only the name is shown.
   */
  webIcon?: ImageSource | number;
  /**
   * Content rendered in the web tab bar beside the tabs: a `Menu` with a
   * `link` trigger, a button. See `webActionsPlacement`.
   */
  webActions?: ReactNode;
  /**
   * Where `webActions` go: between the logo and the tabs, or after the tabs.
   * @default 'before'
   */
  webActionsPlacement?: 'before' | 'after';
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

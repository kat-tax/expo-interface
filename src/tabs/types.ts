import type {Href} from 'expo-router';
import type {SFSymbol, AndroidSymbol} from 'expo-symbols';
import type {ReactNode} from 'react';
import type {ImageSource} from 'expo-image';
import type {SheetMaterial} from '../sheet/types';

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
   * bar's own `hidden`, on web the floating bar is not drawn — unless it
   * carries a screen's header (`webFoldHeader`), where the tabs go and the bar
   * stays as that screen's header.
   * @default false
   */
  hidden?: boolean;
  /**
   * Controls the web tab bar logo. Use a preset mode to show the app icon
   * and/or name, or pass a custom node to replace them entirely. The slot
   * shrinks before the tabs do, so a title in it is bounded by the bar. A
   * folded header's title takes the slot while it is there.
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
   * A folded header's own trailing content takes the same place.
   * @default 'before'
   */
  webActionsPlacement?: 'before' | 'after';
  /**
   * Web only: draws the bar as one of the kit's materials, the ones `Sheet`
   * takes: its fill thinned over a blur of what scrolls under it, a hairline
   * in the separator color at its edge and a soft shadow. Where the browser
   * has no `backdrop-filter`, under a reduced-transparency setting and in
   * forced colors the bar is solid instead. `regular` and `thick` keep the
   * labels legible over any content in both schemes; `thin` lets more
   * through than that in the dark scheme, so use it over the app's own
   * background. Content passes under the bar only on a `Screen underBar`;
   * otherwise the bar sits over the screen's background alone.
   * @default 'none'
   */
  webMaterial?: SheetMaterial;
  /**
   * Web only: the bar takes the header of the screen under it — the title
   * (with a back button on a pushed screen) in the logo slot, `headerRight`
   * in the actions slot — and `ConstrainedStackHeader` draws nothing, so a
   * screen has one bar over it rather than two. The screen then leaves the
   * bar's room itself, as it does with no header at all.
   * @default true
   */
  webFoldHeader?: boolean;
  /**
   * Windows only: the WinUI `NavigationView`'s pane display mode. `top` is
   * a row of items along the top of the window, the tab bar. `left` is the
   * navigation pane down the left side, labels beside the glyphs, and its
   * toggle button collapses it to its glyphs beside the content and back.
   * `compact` is that pane at its glyph-only width, and its toggle button
   * opens the pane over the content. `minimal` is the toggle button alone,
   * at the top start of the content, and the pane opens over the content
   * from there. `auto` follows WinUI's adaptive breakpoints by the width
   * the tabs are given (the window's, at the root): the expanded pane from
   * 1008 points, the compact one from 641, and the minimal one in a
   * narrower window. A pane open over the content closes on a selection,
   * a press beside it or Escape.
   * @default 'top'
   */
  windowsPane?: WindowsPane;
}

export type WindowsPane = 'top' | 'left' | 'compact' | 'minimal' | 'auto';

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
  /**
   * A badge on the tab: a count, or short text. Nothing for `0` or an empty
   * string. Windows draws a count in an `InfoBadge` and any other text as
   * its dot; iOS and Android show it as the native tab bar's badge, web as a
   * pill beside the label.
   */
  badge?: number | string;
  /**
   * Windows only: where the `NavigationView` puts the tab. `menu` is among
   * the items; `footer` is at the pane's foot (the bar's far end in the top
   * mode); `settings` makes the tab WinUI's own settings item, with its gear
   * and its name, so a settings screen is where a Windows user looks for it.
   * The other platforms show the tab as any other.
   * @default 'menu'
   */
  windowsPlacement?: 'menu' | 'footer' | 'settings';
}

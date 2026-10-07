import type {ColorSchemeName} from 'react-native';
import type {ColorScheme} from './scheme-store';
import {useSyncExternalStore} from 'react';
import {Appearance, Platform} from 'react-native';
import {ACCENT_STORAGE_KEY} from './accent';
import {schemeSnapshot, serverScheme, subscribeScheme} from './scheme-store';
import {colors} from './palette';

export type {ColorScheme} from './scheme-store';

/** What an app asks for: the system's scheme, or one forced by the user. */
export type ColorSchemeMode = 'system' | ColorScheme;

/**
 * `localStorage` key under which `setColorScheme` keeps a forced scheme on
 * web, read back by `getThemeBootScript` before the bundle runs.
 */
export const SCHEME_STORAGE_KEY = 'expo-interface:scheme';

type Listener = (preferences: {colorScheme: ColorSchemeName}) => void;

/**
 * Web: react-native-web's `Appearance` only mirrors the `prefers-color-scheme`
 * media query and has no `setColorScheme`. Its two methods are replaced at
 * load: `getColorScheme` answers the forced scheme while one is set, and the
 * change listeners (what React Native's `useColorScheme`, `@expo/ui`'s `Host`
 * and the kit's `useColorScheme` subscribe through) hear a forced change as
 * well as a system one.
 */
let forced: ColorScheme | null = null;
const listeners = new Set<Listener>();
let system: Pick<typeof Appearance, 'getColorScheme' | 'addChangeListener'> | undefined;

function patchAppearance() {
  if (system) return;
  const original = {
    getColorScheme: Appearance.getColorScheme.bind(Appearance),
    addChangeListener: Appearance.addChangeListener.bind(Appearance),
  };
  system = original;
  Appearance.getColorScheme = () => forced ?? original.getColorScheme();
  Appearance.addChangeListener = (listener: Listener) => {
    listeners.add(listener);
    // A system change is only news while the scheme follows the system.
    const subscription = original.addChangeListener(preferences => {
      if (!forced) listener(preferences);
    });
    return {
      remove() {
        listeners.delete(listener);
        subscription.remove();
      },
    };
  };
}

/**
 * Windows shares the patch: react-native-windows follows the OS scheme and
 * its `Appearance.setColorScheme` cannot be relied on to change it, so a
 * forced scheme is kept here, where `useColorScheme`, `useColor` and every
 * XAML island (`useXamlProps`) read it.
 */
const FORCED_IN_JS = Platform.OS === 'web' || Platform.OS === 'windows';

if (FORCED_IN_JS) patchAppearance();

/**
 * The color scheme as an external store: `'light'` or `'dark'`, never
 * unspecified. React Native's own `useColorScheme` re-subscribes on every
 * render; on web, where the change is a `matchMedia` event, an ancestor that
 * re-renders during that event (the router's screens do) makes the hook drop
 * and re-add its listener mid-dispatch, and the event never reaches it. One
 * stable subscription does not. Follows `setColorScheme` on every platform.
 *
 * A static web export is rendered light, since the server has no scheme to
 * read: hydration renders light too, so it matches the HTML, and the scheme
 * the browser reports follows at once. Read during hydration instead, a
 * dark scheme would leave the server's light colors in the page, since React
 * does not patch an attribute that differs.
 */
export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribeScheme, schemeSnapshot, serverScheme);
}

const toKebab = (token: string) => token.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

/**
 * Forces the color scheme, or follows the system again.
 *
 * - iOS and Android: `Appearance.setColorScheme`, so `useColorScheme`, the
 *   kit's `useColor` and every native control follow.
 * - Web: the palette of the forced scheme is written inline on the root
 *   element as the `--color-*` variables (`tint`/`onTint` are left to
 *   `AccentProvider`), `color-scheme` is set so form controls and scrollbars
 *   follow, `data-theme` is set for `@expo/ui`'s own styles, the choice is
 *   saved under `storageKey` for `getThemeBootScript`, and the `Appearance`
 *   listeners hear the change.
 * - Windows: the forced scheme is kept in JavaScript like web's and the
 *   `Appearance` listeners hear it, so `useColorScheme` and the XAML islands
 *   (which take the scheme as a prop) follow; `Appearance.setColorScheme` is
 *   asked as well, for whatever react-native-windows draws itself.
 */
export function setColorScheme(mode: ColorSchemeMode, storageKey = SCHEME_STORAGE_KEY): void {
  if (!FORCED_IN_JS) {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
    return;
  }
  patchAppearance();
  forced = mode === 'system' ? null : mode;
  if (Platform.OS === 'windows') {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  }
  paintForced();
  if (Platform.OS === 'web') {
    try {
      if (forced) localStorage.setItem(storageKey, forced);
      else localStorage.removeItem(storageKey);
    } catch {
      // Storage may be unavailable (privacy mode, server render); the scheme still applies.
    }
  }
  const colorScheme: ColorSchemeName = forced ?? system!.getColorScheme() ?? 'light';
  for (const listener of listeners) listener({colorScheme});
}

/**
 * Web: the forced scheme's palette written on the root element as the
 * `--color-*` variables (`tint`/`onTint` are left to `AccentProvider`), with
 * `color-scheme` and `data-theme`; all of it taken off again for the system.
 */
function paintForced(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const token of Object.keys(colors.light) as (keyof typeof colors.light)[]) {
    if (token === 'tint' || token === 'onTint') continue;
    const name = `--color-${toKebab(token)}`;
    if (forced) root.style.setProperty(name, colors[forced][token]);
    else root.style.removeProperty(name);
  }
  root.style.colorScheme = forced ?? '';
  if (forced) root.dataset.theme = forced;
  else delete root.dataset.theme;
}

/**
 * Web: the scheme an earlier visit forced, read back from the browser's
 * storage, or nothing. The boot script has applied it to the page's CSS
 * before the bundle runs; this puts it back where the JavaScript reads it,
 * so a palette computed in JavaScript is the page's.
 */
export function restoreColorScheme(storageKey = SCHEME_STORAGE_KEY): void {
  if (Platform.OS !== 'web') return;
  let stored: string | null = null;
  try {
    stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey);
  } catch {
    // Storage may be unavailable (privacy mode, a server render).
  }
  if (stored !== 'light' && stored !== 'dark') return;
  forced = stored;
  paintForced();
}

restoreColorScheme();

/**
 * The scheme forced by `setColorScheme` on web, or `'system'`. Natively the
 * forced scheme is `Appearance`'s own and this always answers `'system'`.
 */
export function getColorSchemeMode(): ColorSchemeMode {
  return forced ?? 'system';
}

/**
 * Inline script for `+html.tsx`: before the bundle runs, applies a scheme
 * saved by `setColorScheme` to the root element (`data-theme` and
 * `color-scheme`), so the first paint of the static HTML is already in that
 * scheme; `getThemeCSS` carries the matching `:root[data-theme]` palettes.
 * A system scheme needs nothing: the variables switch on the media query.
 *
 * ```tsx
 * <script dangerouslySetInnerHTML={{__html: getThemeBootScript()}}/>
 * ```
 */
export function getThemeBootScript(storageKey = SCHEME_STORAGE_KEY): string {
  return `(function(){try{var r=document.documentElement,t=localStorage.getItem(${JSON.stringify(storageKey)});if(t==='light'||t==='dark'){r.dataset.theme=t;r.style.colorScheme=t;}var a=JSON.parse(localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)})||'null');if(a&&a.light&&a.dark){var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches),c=d?a.dark:a.light,h=c.replace('#',''),n=parseInt(h.length===3?h.replace(/./g,'$&$&'):h.slice(0,6),16);r.style.setProperty('--color-tint',c);r.style.setProperty('--color-on-tint',(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))>153?'#000000':'#FFFFFF');}}catch(e){}})();`;
}

import type {ColorSchemeName} from 'react-native';
import {useSyncExternalStore} from 'react';
import {Appearance, Platform} from 'react-native';
import {colors} from './theme';

/** The scheme the app is drawn in. */
export type ColorScheme = 'light' | 'dark';

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

if (Platform.OS === 'web') patchAppearance();

const subscribe = (onChange: () => void) => {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
};

const snapshot = (): ColorScheme => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

/**
 * The color scheme as an external store: `'light'` or `'dark'`, never
 * unspecified. React Native's own `useColorScheme` re-subscribes on every
 * render; on web, where the change is a `matchMedia` event, an ancestor that
 * re-renders during that event (the router's screens do) makes the hook drop
 * and re-add its listener mid-dispatch, and the event never reaches it. One
 * stable subscription does not. Follows `setColorScheme` on every platform.
 */
export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
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
 */
export function setColorScheme(mode: ColorSchemeMode, storageKey = SCHEME_STORAGE_KEY): void {
  if (Platform.OS !== 'web') {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
    return;
  }
  patchAppearance();
  forced = mode === 'system' ? null : mode;
  if (typeof document !== 'undefined') {
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
  try {
    if (forced) localStorage.setItem(storageKey, forced);
    else localStorage.removeItem(storageKey);
  } catch {
    // Storage may be unavailable (privacy mode, server render); the scheme still applies.
  }
  const colorScheme: ColorSchemeName = forced ?? system!.getColorScheme() ?? 'light';
  for (const listener of listeners) listener({colorScheme});
}

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
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(storageKey)});if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}})();`;
}

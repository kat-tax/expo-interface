import {useSyncExternalStore} from 'react';
import {addons} from 'storybook/preview-api';
import {GLOBALS_UPDATED, SET_GLOBALS} from 'storybook/internal/core-events';
import {onPrefersDarkChange, resolveScheme} from './theme';
import type {ThemeGlobals} from './theme';

/**
 * The preview's globals as an external store. Decorators get globals from
 * their story context, but the docs container and the `<html>` element have
 * no story, so they read them here. `SET_GLOBALS` carries the initial values
 * (including those restored from the URL), `GLOBALS_UPDATED` every change.
 */
let globals: ThemeGlobals = {};
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function set(next: ThemeGlobals) {
  globals = next;
  applyScheme();
  notify();
}

/**
 * Mirrors the scheme choice to `<html data-theme>`, which forces the palette
 * regardless of the OS `prefers-color-scheme`: `injectThemeCSS` overrides the
 * kit's custom properties and `color-scheme` per `[data-theme]`, @expo/ui's
 * own web palette honors the same attribute, and `preview-head.html` routes
 * `matchMedia('(prefers-color-scheme: …)')` (react-native-web's
 * `useColorScheme`) through it too.
 *
 * Also drops the inline `background-color` that `Screen` mirrors to `<body>`
 * through expo-system-ui: it is written once at module load from the OS
 * scheme and only refreshed while a `Screen` is mounted, so under a forced
 * scheme it would keep the wrong color and show through as a flash between
 * pages. Without it the kit's `body { background-color: var(--color-background) }`
 * applies, which follows `[data-theme]`; a mounted `Screen` writes the same
 * forced color back.
 */
function applyScheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const {scheme} = globals;
  if (scheme === 'light' || scheme === 'dark') root.dataset.theme = scheme;
  else delete root.dataset.theme;
  document.body?.style.removeProperty('background-color');
}

if (typeof window !== 'undefined') {
  addons.ready().then(channel => {
    channel.on(SET_GLOBALS, ({globals: next}: {globals: ThemeGlobals}) => set(next));
    channel.on(GLOBALS_UPDATED, ({globals: next}: {globals: ThemeGlobals}) => set(next));
  });
  // `system` follows the OS, so an OS change re-renders theme consumers too.
  onPrefersDarkChange(notify);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGlobals(): ThemeGlobals {
  return useSyncExternalStore(subscribe, () => globals, () => globals);
}

/** The scheme in effect: the toolbar choice, or the OS scheme for `system`. */
export function useScheme() {
  const {scheme} = useGlobals();
  return useSyncExternalStore(subscribe, () => resolveScheme(scheme), () => resolveScheme(scheme));
}

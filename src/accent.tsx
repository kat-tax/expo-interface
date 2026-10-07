import type {ComponentType, PropsWithChildren} from 'react';
import type {ColorScheme} from './scheme-store';
import {createContext, Fragment, useContext, useEffect, useMemo, useSyncExternalStore} from 'react';
import {Platform} from 'react-native';
import {SCHEME_BACKGROUND} from './backgrounds';
import {loadKeyboardController} from './keyboard/library';
import {legibleTint} from './legible';
import {schemeSnapshot, serverScheme, subscribeScheme} from './scheme-store';

/**
 * Default accent seed (iOS systemBlue). A single color that seeds the tint on
 * every platform:
 * - Android: generates a full Material 3 palette via `SchemeTonalSpot` (the
 *   Material You algorithm), light and dark, through the Compose `Host`
 *   `seedColor` prop and `useMaterialColors({seedColor})`.
 * - iOS: applied verbatim as the SwiftUI `tint` (cascades from the `Host`),
 *   like a single-color AccentColor asset.
 * - Web: emitted as the `--color-tint` default by `getThemeCSS`; runtime
 *   overrides are applied as inline custom properties (see AccentProvider).
 */
export const ACCENT_SEED = '#007AFF';

/** A seed for each scheme, for an accent that reads differently on a light background and a dark one. */
export interface AccentSeeds {
  light: string;
  dark: string;
}

/** An accent: one seed for both schemes, or one for each. */
export type AccentSeed = string | AccentSeeds;

/** The accent as the provider resolved it: the tint in each scheme, and the color drawn on it. */
export interface ResolvedAccent {
  light: string;
  dark: string;
  onLight: string;
  onDark: string;
}

/**
 * `localStorage` key under which `AccentProvider` keeps the resolved accent
 * on web, read back by `getThemeBootScript` before the bundle runs and by
 * `resolvedPalette()` before React does.
 */
export const ACCENT_STORAGE_KEY = 'expo-interface:accent';

/**
 * Contrast color (black or white) for content rendered on top of the accent.
 * Used for iOS/web `onTint`; Android uses the seeded palette's `onPrimary`.
 */
export function onAccent(seed: string): '#000000' | '#FFFFFF' {
  let hex = seed.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex.slice(0, 6), 16);
  if (Number.isNaN(n)) return '#FFFFFF';
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 153 ? '#000000' : '#FFFFFF';
}

/**
 * The tint in each scheme: the seed for that scheme, made legible on the
 * scheme's background when `minContrast` asks for a ratio (4.5 is WCAG's for
 * text), and the color drawn on each.
 */
export function resolveAccent(seed: AccentSeed, minContrast?: number): ResolvedAccent {
  const pick = (scheme: ColorScheme) => {
    const raw = typeof seed === 'string' ? seed : seed[scheme];
    return minContrast ? legibleTint(raw, SCHEME_BACKGROUND[scheme], minContrast) : raw;
  };
  const light = pick('light');
  const dark = pick('dark');
  return {light, dark, onLight: onAccent(light), onDark: onAccent(dark)};
}

const DEFAULT_ACCENT = resolveAccent(ACCENT_SEED);

/** The accent saved on web by an earlier visit, or nothing. */
function readStoredAccent(): ResolvedAccent | null {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(ACCENT_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<ResolvedAccent>;
    if (typeof stored.light !== 'string' || typeof stored.dark !== 'string') return null;
    return {light: stored.light, dark: stored.dark, onLight: onAccent(stored.light), onDark: onAccent(stored.dark)};
  } catch {
    // Storage may be unavailable (privacy mode, a server render), or what is there not the kit's.
    return null;
  }
}

/**
 * The accent the app last provided, for code that runs outside React:
 * `resolvedPalette()` reads it. On web it starts as the one an earlier visit
 * saved, so the palette is right before the provider has mounted.
 */
let current: ResolvedAccent = (Platform.OS === 'web' ? readStoredAccent() : null) ?? DEFAULT_ACCENT;

/** The accent the app last provided, resolved for both schemes. */
export function currentAccent(): ResolvedAccent {
  return current;
}

const AccentContext = createContext<ResolvedAccent>(DEFAULT_ACCENT);

/**
 * `react-native-keyboard-controller`'s provider when the app has the library
 * (natively only; never on web), so `KeyboardBar` can read the keyboard's
 * movement anywhere under the kit's root. A fragment otherwise.
 */
const KeyboardProvider: ComponentType<PropsWithChildren> = loadKeyboardController()?.KeyboardProvider ?? Fragment;

/** The active accent seed color for the scheme the app is drawn in. */
export function useAccentSeed(): string {
  const accent = useContext(AccentContext);
  const scheme = useSyncExternalStore(subscribeScheme, schemeSnapshot, serverScheme);
  return accent[scheme];
}

interface AccentProviderProps extends PropsWithChildren {
  /**
   * The accent: one seed for both schemes, or `{light, dark}`. Omit it for
   * the default.
   */
  seed?: AccentSeed;
  /**
   * A contrast ratio the tint must reach against the scheme's background
   * (4.5 is WCAG's for text). A seed short of it in a scheme is made lighter
   * on dark or darker on light until it reaches it; one that reaches it is
   * kept as it is.
   */
  minContrast?: number;
  /**
   * Web only: keep the accent in the browser's storage, so the next visit's
   * first paint and `resolvedPalette()` have it before React runs.
   * @default true
   */
  persist?: boolean;
}

/**
 * Provides the accent seed to the app, and the keyboard provider natively
 * (see `KeyboardBar`). Pass `seed` to apply a user-supplied accent; omit it
 * for the hardcoded default. On web the scheme's tint is mirrored to the
 * `--color-tint`/`--color-on-tint` custom properties (inline styles win over
 * the `:root` defaults emitted by `getThemeCSS`), so all CSS consumers react
 * without JS recomputation, and the accent is kept in the browser's storage.
 */
export function AccentProvider({seed = ACCENT_SEED, minContrast, persist = true, children}: AccentProviderProps) {
  const light = typeof seed === 'string' ? seed : seed.light;
  const dark = typeof seed === 'string' ? seed : seed.dark;
  const accent = useMemo(() => resolveAccent({light, dark}, minContrast), [light, dark, minContrast]);
  const scheme = useSyncExternalStore(subscribeScheme, schemeSnapshot, serverScheme);
  const isDefault = accent.light === ACCENT_SEED && accent.dark === ACCENT_SEED;

  useEffect(() => {
    current = accent;
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDefault) {
      root.style.removeProperty('--color-tint');
      root.style.removeProperty('--color-on-tint');
    } else {
      root.style.setProperty('--color-tint', accent[scheme]);
      root.style.setProperty('--color-on-tint', scheme === 'dark' ? accent.onDark : accent.onLight);
    }
    if (!persist) return;
    try {
      if (isDefault) localStorage.removeItem(ACCENT_STORAGE_KEY);
      else localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify({light: accent.light, dark: accent.dark}));
    } catch {
      // Storage may be unavailable; the accent still applies.
    }
  }, [accent, scheme, isDefault, persist]);

  return (
    <KeyboardProvider>
      <AccentContext.Provider value={accent}>{children}</AccentContext.Provider>
    </KeyboardProvider>
  );
}

import type {PropsWithChildren} from 'react';
import {createContext, useContext, useEffect} from 'react';
import {Platform} from 'react-native';

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

const AccentContext = createContext(ACCENT_SEED);

/** The active accent seed color (hardcoded default or user-supplied). */
export function useAccentSeed(): string {
  return useContext(AccentContext);
}

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
 * Provides the accent seed to the app. Pass `seed` to apply a user-supplied
 * accent; omit it for the hardcoded default. On web the seed is mirrored to
 * the `--color-tint`/`--color-on-tint` custom properties (inline styles win
 * over the `:root` defaults emitted by `getThemeCSS`), so all CSS consumers
 * react without JS recomputation.
 */
export function AccentProvider({seed = ACCENT_SEED, children}: PropsWithChildren<{seed?: string}>) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;
    if (seed === ACCENT_SEED) {
      root.style.removeProperty('--color-tint');
      root.style.removeProperty('--color-on-tint');
      return;
    }
    root.style.setProperty('--color-tint', seed);
    root.style.setProperty('--color-on-tint', onAccent(seed));
  }, [seed]);

  return <AccentContext.Provider value={seed}>{children}</AccentContext.Provider>;
}

import './global.css';
import type {CSSProperties} from 'react';
import type {ColorValue, TextStyle} from 'react-native';

import {useMemo} from 'react';
import {DefaultTheme} from 'expo-router';
import {Platform, PlatformColor} from 'react-native';
import {TypographyVariant, TypographyStyle} from './typography/types';
import {ACCENT_SEED, onAccent, useAccentSeed} from './accent';
import {useColorScheme} from './scheme';
import {useHighContrast} from './windows/contrast';
import {highContrastPalette} from './windows/contrast-palette';

export type VariantMap = Record<TypographyVariant, TypographyStyle>;
export type ColorTokens = keyof typeof colors[keyof typeof colors];
export type ColorValues = typeof colors[keyof typeof colors];
/** A resolved palette: one plain color string per token (see `usePalette`). */
export type Palette = Record<ColorTokens, string>;
export type ColorNative = ColorValue | (() => ColorValue);

export const VALID_STYLES = [
  // Position
  'flexGrow',
  'flexShrink',
  // Dimension
  'width',
  'minWidth',
  'maxWidth',
  // Spacing
  'margin',
  'marginTop',
  'marginLeft',
  'marginRight',
  'marginBottom',
  'padding',
  'paddingTop',
  'paddingLeft',
  'paddingRight',
  'paddingBottom',
] as const;

export const EXPAND_KEYS = {
  marginVertical: ['marginTop', 'marginBottom'],
  marginHorizontal: ['marginLeft', 'marginRight'],
  paddingVertical: ['paddingTop', 'paddingBottom'],
  paddingHorizontal: ['paddingLeft', 'paddingRight'],
} as const;

export const bound = {
  contentMaxWidth: 800,
} as const;

export const spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const inset = {
  topBar: Platform.select({
    default: 0,
    web: 80,
  }),
  bottomTab: Platform.select({
    default: 0,
    android: 80,
    ios: 50,
  }),
  /**
   * The native stack header's own height, below the status bar: the
   * navigation bar's on iOS, the top app bar's on Android. What a screen
   * under a header it runs under (`TabStack material`) leaves clear.
   */
  header: Platform.select({
    default: 0,
    android: 56,
    ios: 44,
  }),
} as const;

export const fonts = Platform.select({
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    mono: 'var(--font-mono)',
    rounded: 'var(--font-rounded)',
  },
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    mono: 'ui-monospace',
    rounded: 'ui-rounded',
  },
  // The Windows 11 UI faces; DirectWrite falls back to Segoe UI on Windows 10.
  windows: {
    sans: 'Segoe UI Variable Text',
    serif: 'Cambria',
    mono: 'Cascadia Mono',
    rounded: 'Segoe UI Variable Text',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '900',
} as const;

/**
 * Concrete scheme palette. These are the values `useColor` resolves on iOS
 * and Android (visual parity with web), the `default` of every `theme`
 * token, and the values emitted as CSS custom properties by `getThemeCSS`
 * on web. Native Compose controls on Android (text fields, switches,
 * pickers, dialogs) are themed separately by the accent-seeded Material 3
 * Host palette (`seedColor` on the Screen `Host`).
 *
 * `tint`/`onTint` derive from the accent seed (see `accent.tsx`) — a single
 * color for both schemes, like a single-color iOS AccentColor asset.
 */
export const colors = {
  light: {
    label: '#000000',
    secondaryLabel: '#60646C',
    tertiaryLabel: '#9094A0',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    separator: 'rgba(60, 60, 67, 0.29)',
    tint: ACCENT_SEED,
    onTint: onAccent(ACCENT_SEED),
    pillBackground: 'rgba(118, 118, 128, 0.12)',
    segmentSelected: '#FFFFFF',
    switchTrack: '#e9e9ea',
    switchOn: '#34C759',
    success: '#34C759',
    destructive: '#FF3B30',
    onDestructive: '#FFFFFF',
    highlight: '#FFF1B8',
    opaqueSeparator: '#C6C6C8',
  },
  dark: {
    label: '#ffffff',
    secondaryLabel: '#B0B4BA',
    tertiaryLabel: '#6E7378',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    separator: 'rgba(84, 84, 88, 0.6)',
    tint: ACCENT_SEED,
    onTint: onAccent(ACCENT_SEED),
    pillBackground: 'rgba(118, 118, 128, 0.24)',
    segmentSelected: '#636366',
    switchTrack: '#39393d',
    switchOn: '#30D158',
    success: '#30D158',
    destructive: '#FF453A',
    onDestructive: '#FFFFFF',
    highlight: '#4D4000',
    opaqueSeparator: '#38383A',
  },
} as const;

/**
 * Static, scheme-adaptive color tokens. Three resolution paths exist:
 *
 * 1. `theme.*` (this object) — opaque platform values: iOS `PlatformColor`
 *    (resolved by UIKit per scheme), Android theme attributes, web
 *    `var(--color-*)` custom properties, Windows Fluent theme resources
 *    (`PlatformColor('TextFillColorPrimary')`, resolved by
 *    react-native-windows per scheme and in high contrast; a token with no
 *    Fluent twin keeps the light literal). Use in styles that the platform
 *    resolves natively.
 * 2. `useColor(token)` — a concrete string usable anywhere: on native the
 *    scheme palette hex (tint/onTint from the live accent seed — identical
 *    on iOS and Android for web parity), on web the CSS var (stays reactive
 *    in CSS). Compose-native controls are instead themed by the seeded
 *    Android Host (`hostAccentProps`).
 * 3. `getThemeCSS()` — emits the palette as `--color-*` vars on web;
 *    `AccentProvider` overlays user-supplied tints as inline vars.
 *
 * The accent seed (`accent.tsx`) is the single source for all tints. Note
 * the static iOS/Android entries below cannot react to a runtime
 * user-supplied seed — only `useColor`/CSS vars do.
 */
export const theme = {
  /**
   * Primary text.
   * - iOS: `PlatformColor('label')` — #000 light / #fff dark.
   * - Android: `?android:attr/textColorPrimary` here; palette via `useColor`.
   * - Web: `var(--color-label)`.
   * - Fallback: #000000 light / #ffffff dark.
   */
  label: getPlatformToken({
    ios: () => PlatformColor('label'),
    android: () => PlatformColor('?android:attr/textColorPrimary'),
    web: 'var(--color-label)',
    windows: () => PlatformColor('TextFillColorPrimary'),
    default: colors.light.label,
  }),
  /**
   * Secondary text (subtitles, captions).
   * - iOS: `PlatformColor('secondaryLabel')`.
   * - Android: `?android:attr/textColorSecondary` here; palette via `useColor`.
   * - Web: `var(--color-secondary-label)`.
   * - Fallback: #60646C light / #B0B4BA dark.
   */
  secondaryLabel: getPlatformToken({
    ios: () => PlatformColor('secondaryLabel'),
    android: () => PlatformColor('?android:attr/textColorSecondary'),
    web: 'var(--color-secondary-label)',
    windows: () => PlatformColor('TextFillColorSecondary'),
    default: colors.light.secondaryLabel,
  }),
  /**
   * Tertiary text (placeholders, disabled hints, decorative glyphs).
   * - iOS: `PlatformColor('tertiaryLabel')`.
   * - Android: `?android:attr/textColorTertiary` here; palette via `useColor`.
   * - Web: `var(--color-tertiary-label)`.
   * - Fallback: #9094A0 light / #6E7378 dark.
   */
  tertiaryLabel: getPlatformToken({
    ios: () => PlatformColor('tertiaryLabel'),
    android: () => PlatformColor('?android:attr/textColorTertiary'),
    web: 'var(--color-tertiary-label)',
    // Fluent's tertiary text is not among the resources react-native-windows
    // resolves; the disabled text is the nearest.
    windows: () => PlatformColor('TextFillColorDisabled'),
    default: colors.light.tertiaryLabel,
  }),
  /**
   * Screen background.
   * - iOS: `PlatformColor('systemBackground')`.
   * - Android: `?android:attr/colorBackground` here; palette via `useColor`.
   * - Web: `var(--color-background)`.
   * - Fallback: #ffffff light / #000000 dark.
   */
  background: getPlatformToken({
    ios: () => PlatformColor('systemBackground'),
    android: () => PlatformColor('?android:attr/colorBackground'),
    web: 'var(--color-background)',
    windows: () => PlatformColor('SolidBackgroundFillColorBase'),
    default: colors.light.background,
  }),
  /**
   * Raised/inset element background (cards, list rows).
   * - iOS: `PlatformColor('secondarySystemBackground')`.
   * - Android: `?android:attr/colorBackgroundFloating` here; palette via `useColor`.
   * - Web: `var(--color-background-element)`.
   * - Fallback: #F0F0F3 light / #212225 dark.
   */
  backgroundElement: getPlatformToken({
    ios: () => PlatformColor('secondarySystemBackground'),
    android: () => PlatformColor('?android:attr/colorBackgroundFloating'),
    web: 'var(--color-background-element)',
    windows: () => PlatformColor('ControlFillColorDefault'),
    default: colors.light.backgroundElement,
  }),
  /**
   * Selected/pressed element background.
   * - iOS: `PlatformColor('tertiarySystemBackground')`.
   * - Android: `?android:attr/colorControlHighlight` here; palette via `useColor`.
   * - Web: `var(--color-background-selected)`.
   * - Fallback: #E0E1E6 light / #2E3135 dark.
   */
  backgroundSelected: getPlatformToken({
    ios: () => PlatformColor('tertiarySystemBackground'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-background-selected)',
    windows: () => PlatformColor('SubtleFillColorSecondary'),
    default: colors.light.backgroundSelected,
  }),
  /**
   * Hairline separators and borders.
   * - iOS: `PlatformColor('separator')`.
   * - Android: `?android:attr/colorControlHighlight` here; palette via `useColor`.
   * - Web: `var(--color-separator)`.
   * - Fallback: rgba(60,60,67,0.29) light / rgba(84,84,88,0.6) dark.
   */
  separator: getPlatformToken({
    ios: () => PlatformColor('separator'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-separator)',
    windows: () => PlatformColor('ControlStrokeColorDefault'),
    default: colors.light.separator,
  }),
  /**
   * Accent color for interactive elements, derived from the accent seed.
   * - iOS: the hardcoded seed here; SwiftUI children get it via the Host-level
   *   `tint()` cascade, and `useColor('tint')` returns the live seed.
   * - Android: `?attr/colorPrimary` here; `useColor('tint')` returns the
   *   live seed (web parity). Compose-native controls derive their own M3
   *   `primary` from the Host `seedColor`.
   * - Web: `var(--color-tint)` — default emitted from the seed, user-supplied
   *   seeds applied as inline vars by `AccentProvider`.
   * - Fallback: ACCENT_SEED (#007AFF) both schemes.
   */
  tint: getPlatformToken({
    ios: ACCENT_SEED,
    android: () => PlatformColor('?attr/colorPrimary'),
    web: 'var(--color-tint)',
    default: colors.light.tint,
  }),
  /**
   * Content rendered on top of the accent (filled-button labels/icons).
   * - iOS/Android: luminance contrast of the live seed via `useColor`
   *   (white for #007AFF).
   * - Web: `var(--color-on-tint)`; follows the seed via `AccentProvider`.
   * - Fallback: contrast of ACCENT_SEED (#FFFFFF) both schemes.
   */
  onTint: getPlatformToken({
    ios: onAccent(ACCENT_SEED),
    android: onAccent(ACCENT_SEED),
    web: 'var(--color-on-tint)',
    default: colors.light.onTint,
  }),
  /**
   * Pill/segmented control background.
   * - iOS: `PlatformColor('secondarySystemFill')`.
   * - Android: `?android:attr/colorControlHighlight` here; palette via `useColor`.
   * - Web: `var(--color-pill-background)`.
   * - Fallback: rgba(118,118,128,0.12) light / rgba(118,118,128,0.24) dark.
   */
  pillBackground: getPlatformToken({
    ios: () => PlatformColor('secondarySystemFill'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-pill-background)',
    windows: () => PlatformColor('ControlAltFillColorTertiary'),
    default: colors.light.pillBackground,
  }),
  /**
   * Raised segment of a segmented control — the selected pill sitting on the
   * `pillBackground` track. iOS has no system color for it (UIKit paints the
   * `selectedSegmentTintColor` itself), so the two schemes differ by value
   * rather than by platform: use `useColor('segmentSelected')`, which is
   * scheme-aware everywhere; the static entry below is the light value.
   * - Web: `var(--color-segment-selected)`.
   * - Fallback: #FFFFFF light / #636366 dark.
   */
  segmentSelected: getPlatformToken({
    ios: colors.light.segmentSelected,
    android: colors.light.segmentSelected,
    web: 'var(--color-segment-selected)',
    windows: () => PlatformColor('ControlFillColorDefault'),
    default: colors.light.segmentSelected,
  }),
  /**
   * Switch "off" track.
   * - iOS: `PlatformColor('systemGray5')`.
   * - Android: `?android:attr/colorControlHighlight` here; palette via `useColor`.
   *   (The Compose Switch is themed natively by the seeded Host.)
   * - Web: `var(--color-switch-track)`.
   * - Fallback: #e9e9ea light / #39393d dark.
   */
  switchTrack: getPlatformToken({
    ios: () => PlatformColor('systemGray5'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-switch-track)',
    windows: () => PlatformColor('ControlAltFillColorSecondary'),
    default: colors.light.switchTrack,
  }),
  /**
   * The green a switch's track takes while on (iOS systemGreen). Switches
   * themselves follow the accent `tint` on every platform (the iOS Host
   * `tint` cascade colors the SwiftUI `Toggle` with the seed); `success` is
   * the token for a state that went well.
   * - iOS: `PlatformColor('systemGreen')` — #34C759 light / #30D158 dark.
   * - Android: `?attr/colorPrimary` here; palette via `useColor`.
   * - Web: `var(--color-switch-on)`.
   * - Fallback: #34C759 light / #30D158 dark.
   */
  switchOn: getPlatformToken({
    ios: () => PlatformColor('systemGreen'),
    android: () => PlatformColor('?attr/colorPrimary'),
    web: 'var(--color-switch-on)',
    default: colors.light.switchOn,
  }),
  /**
   * A state that went well: a finished upload, a peer online, a check that
   * passed. iOS's systemGreen; the same green on the other platforms, which
   * name no success colour of their own (Material has no success role, and
   * Fluent's is a fill behind text rather than a colour for it).
   * - iOS: `PlatformColor('systemGreen')`.
   * - Web: `var(--color-success)`.
   * - Fallback: #34C759 light / #30D158 dark.
   */
  success: getPlatformToken({
    ios: () => PlatformColor('systemGreen'),
    android: colors.light.success,
    web: 'var(--color-success)',
    default: colors.light.success,
  }),
  /**
   * Destructive actions (delete buttons, error states).
   * - iOS: `PlatformColor('systemRed')` — #FF3B30 light / #FF453A dark.
   * - Android: `?attr/colorError` here; palette via `useColor` (web parity).
   * - Web: `var(--color-destructive)`.
   * - Fallback: #FF3B30 light / #FF453A dark.
   */
  destructive: getPlatformToken({
    ios: () => PlatformColor('systemRed'),
    android: () => PlatformColor('?attr/colorError'),
    web: 'var(--color-destructive)',
    default: colors.light.destructive,
  }),
  /**
   * Content rendered on top of the destructive color.
   * - iOS/Android: white via `useColor` (matches labels on filled
   *   systemRed/destructive buttons).
   * - Web: `var(--color-on-destructive)`.
   * - Fallback: #FFFFFF both schemes.
   */
  onDestructive: getPlatformToken({
    ios: colors.light.onDestructive,
    android: colors.light.onDestructive,
    web: 'var(--color-on-destructive)',
    default: colors.light.onDestructive,
  }),
  /**
   * The fill behind marked text: a quote, a search hit, a change under
   * review. An opaque amber in both schemes, so an editor that takes a
   * `#rrggbb` can take it as it is and the label color still reads on it.
   * No platform names one, so the value is the palette's everywhere.
   * - Web: `var(--color-highlight)`.
   * - Fallback: #FFF1B8 light / #4D4000 dark.
   */
  highlight: getPlatformToken({
    ios: colors.light.highlight,
    android: colors.light.highlight,
    web: 'var(--color-highlight)',
    default: colors.light.highlight,
  }),
  /**
   * The separator as an opaque colour, for a surface that cannot blend a
   * translucent one: a canvas, an editor's own rule, an image's edge.
   * - iOS: `PlatformColor('opaqueSeparator')` — #C6C6C8 light / #38383A dark.
   * - Web: `var(--color-opaque-separator)`.
   * - Fallback: #C6C6C8 light / #38383A dark.
   */
  opaqueSeparator: getPlatformToken({
    ios: () => PlatformColor('opaqueSeparator'),
    android: colors.light.opaqueSeparator,
    web: 'var(--color-opaque-separator)',
    default: colors.light.opaqueSeparator,
  }),
} as const;

let navBase: typeof DefaultTheme | undefined;

/**
 * The navigation theme's base, built on first use rather than at load:
 * expo-router's default theme is read then. expo-router loads modules of its
 * own while it initializes (its native stack imports `expo-glass-effect`,
 * which the kit answers for on Windows), and one of them importing the kit
 * would find expo-router's exports still undefined here.
 */
function navTheme(): typeof DefaultTheme {
  navBase ??= {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.tint,
      background: theme.background,
      card: theme.backgroundElement,
      text: theme.label,
      border: theme.separator,
    },
    fonts: {
      regular: {fontFamily: fonts.sans, fontWeight: fontWeights.normal},
      medium: {fontFamily: fonts.sans, fontWeight: fontWeights.medium},
      bold: {fontFamily: fonts.sans, fontWeight: fontWeights.bold},
      heavy: {fontFamily: fonts.sans, fontWeight: fontWeights.heavy},
    },
  };
  return navBase;
}

/**
 * React Navigation does not resolve PlatformColor tokens on native headers,
 * so resolve concrete palette colors (with the live accent seed as primary).
 * The theme also says which scheme it is: the native stack hands `dark` to
 * the bar as its interface style, which is what a system material and a
 * menu presented from the bar draw in. Left at the default's `false`, a
 * translucent header and its menus came out light in the dark scheme.
 */
export function useNavTheme() {
  const nav = navTheme();
  if (Platform.OS === 'web') return nav;
  /* eslint-disable react-hooks/rules-of-hooks -- Platform.OS is a runtime constant. */
  const seed = useAccentSeed();
  const scheme = useColorScheme();
  const contrast = useHighContrast();
  /* eslint-enable react-hooks/rules-of-hooks */
  const palette = contrast.colors ? highContrastPalette(contrast.colors) : colors[scheme];
  return {
    ...nav,
    dark: scheme === 'dark',
    colors: {
      ...nav.colors,
      primary: contrast.colors ? palette.tint : seed,
      background: palette.background,
      card: palette.backgroundElement,
      text: palette.label,
      border: palette.separator,
    },
  };
}

const iosVars: VariantMap = {
  largeTitle: {fontSize: 34, fontWeight: 'bold', lineHeight: 41, letterSpacing: 0.37},
  title: {fontSize: 28, fontWeight: 'bold', lineHeight: 34, letterSpacing: 0.36},
  title2: {fontSize: 22, fontWeight: 'bold', lineHeight: 28, letterSpacing: 0.35},
  title3: {fontSize: 20, fontWeight: 'semibold', lineHeight: 25, letterSpacing: 0.38},
  headline: {fontSize: 17, fontWeight: 'semibold', lineHeight: 22, letterSpacing: -0.41},
  body: {fontSize: 17, fontWeight: 'normal', lineHeight: 22, letterSpacing: -0.41},
  callout: {fontSize: 16, fontWeight: 'normal', lineHeight: 21, letterSpacing: -0.32},
  subheadline: {fontSize: 15, fontWeight: 'normal', lineHeight: 20, letterSpacing: -0.24},
  footnote: {fontSize: 13, fontWeight: 'normal', lineHeight: 18, letterSpacing: -0.08},
  caption: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  label: {fontSize: 14, fontWeight: 'medium', lineHeight: 18},
};

const androidVars: VariantMap = {
  largeTitle: {fontSize: 32, fontWeight: 'normal', lineHeight: 40},
  title: {fontSize: 28, fontWeight: 'normal', lineHeight: 36},
  title2: {fontSize: 22, fontWeight: 'normal', lineHeight: 28},
  title3: {fontSize: 20, fontWeight: 'medium', lineHeight: 26},
  headline: {fontSize: 16, fontWeight: 'medium', lineHeight: 24},
  body: {fontSize: 16, fontWeight: 'normal', lineHeight: 24},
  callout: {fontSize: 16, fontWeight: 'normal', lineHeight: 24},
  subheadline: {fontSize: 14, fontWeight: 'normal', lineHeight: 20},
  footnote: {fontSize: 13, fontWeight: 'normal', lineHeight: 18},
  caption: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  label: {fontSize: 12, fontWeight: 'medium', lineHeight: 16},
};

/**
 * The Fluent type ramp (Segoe UI Variable), with the kit's variants laid on
 * it: `largeTitle` is Fluent's Title Large, `title` its Title, `title2` its
 * Subtitle, `title3` its Body Large, `headline` its Body Strong, `body` its
 * Body and `caption` its Caption.
 */
const windowsVars: VariantMap = {
  largeTitle: {fontSize: 40, fontWeight: 'semibold', lineHeight: 52},
  title: {fontSize: 28, fontWeight: 'semibold', lineHeight: 36},
  title2: {fontSize: 20, fontWeight: 'semibold', lineHeight: 28},
  title3: {fontSize: 18, fontWeight: 'semibold', lineHeight: 24},
  headline: {fontSize: 14, fontWeight: 'semibold', lineHeight: 20},
  body: {fontSize: 14, fontWeight: 'normal', lineHeight: 20},
  callout: {fontSize: 14, fontWeight: 'normal', lineHeight: 20},
  subheadline: {fontSize: 13, fontWeight: 'normal', lineHeight: 18},
  footnote: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  caption: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  label: {fontSize: 14, fontWeight: 'normal', lineHeight: 20},
};

export const variants = Platform.select({
  default: iosVars,
  android: androidVars,
  ios: iosVars,
  web: iosVars,
  windows: windowsVars,
});

/**
 * Resolves a color token to a usable string value.
 *
 * - Web: returns the `var(--color-*)` custom property so theming stays fully
 *   reactive through CSS (driven by `getThemeCSS` + `AccentProvider`), never
 *   recomputed in JS.
 * - Android: resolves the Material 3 role from the palette seeded by the
 *   accent color (scheme-aware, every API level).
 * - iOS: PlatformColor values are opaque objects that can't be consumed
 *   everywhere (they stringify to "[object Object]" and aren't honored by
 *   expo-symbols glyphs), so resolve a concrete palette color that reacts to
 *   the active light/dark scheme; `tint`/`onTint` follow the live accent seed.
 */
export function useColor(token: ColorTokens): string {
  if (Platform.OS === 'web') return theme[token] as string;
  /* eslint-disable react-hooks/rules-of-hooks -- Platform.OS is a runtime constant. */
  const seed = useAccentSeed();
  const scheme = useColorScheme();
  const contrast = useHighContrast();
  /* eslint-enable react-hooks/rules-of-hooks */
  if (contrast.colors) return highContrastPalette(contrast.colors)[token];
  if (token === 'tint') return seed;
  if (token === 'onTint') return onAccent(seed);
  return colors[scheme][token];
}

/**
 * The resolved palette of the current scheme, with the live accent seed as
 * `tint` and its contrast as `onTint`: plain color strings on every platform,
 * including web. `useColor` stays the right call for styles (on web it hands
 * out the CSS variable, which follows the scheme without a re-render);
 * `usePalette` is for canvases, native views and anything else that cannot
 * read a variable.
 */
export function usePalette(): Palette {
  const seed = useAccentSeed();
  const scheme = useColorScheme();
  const contrast = useHighContrast();
  return useMemo(
    () =>
      contrast.colors
        ? highContrastPalette(contrast.colors)
        : {...colors[scheme], tint: seed, onTint: onAccent(seed)},
    [scheme, seed, contrast],
  );
}

export function getPlatformToken(specifics: {
  default: ColorValue;
  android: ColorNative;
  ios: ColorNative;
  web: ColorValue;
  /**
   * A Fluent theme resource `PlatformColor` where react-native-windows
   * resolves one; a token without one takes the `default` literal.
   */
  windows?: ColorNative;
}): ColorValue {
  const get = (c: ColorNative) => typeof c === 'function' ? c() : c;
  switch (Platform.OS) {
    case 'ios':
      return get(specifics.ios);
    case 'android':
      return get(specifics.android);
    case 'web':
      return specifics.web;
    case 'windows':
      return get(specifics.windows ?? specifics.default);
    default:
      return specifics.default;
  }
}

/**
 * The palette as `--color-*` custom properties for `+html.tsx`: the light
 * values on `:root`, the dark ones under the `prefers-color-scheme` media
 * query, and both again keyed on `data-theme`, which `setColorScheme` (and
 * the `getThemeBootScript` boot script) set on the root element to force a
 * scheme regardless of the system's. `tint`/`onTint` are the same in both
 * schemes, so the forced palettes leave them to the defaults and to
 * `AccentProvider`.
 */
export function getThemeCSS(): string {
  const format = (s: string) => s.replace(/[A-Z]/g, v => `-${v.toLowerCase()}`);
  const render = (o: ColorValues, skipAccent = false) => Object.entries(o)
    .filter(([k]) => !skipAccent || (k !== 'tint' && k !== 'onTint'))
    .map(([k,v]) => `\t\t${`--color-${format(k)}`}: ${v};`).join('\n');
  // The body painted in the scheme's background from the first byte of the
  // page, before the bundle's own stylesheet has arrived: a static export
  // that opens dark shows no white behind its content.
  return `
    :root {
      color-scheme: light dark;
      ${render(colors.light)}
    }
    body {
      background-color: var(--color-background);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        ${render(colors.dark)}
      }
    }
    :root[data-theme="light"] {
      color-scheme: light;
      ${render(colors.light, true)}
    }
    :root[data-theme="dark"] {
      color-scheme: dark;
      ${render(colors.dark, true)}
    }
  `;
}

export function flatten(style?: TextStyle): CSSProperties {
  if (!style) return {};
  const css: CSSProperties = {};
  if (typeof style.opacity === 'number')
    css.opacity = style.opacity;
  if (typeof style.color === 'string')
    css.color = style.color;
  for (const key of VALID_STYLES) {
    if (style[key] != null)
      css[key] = style[key] as never;
  }
  for (const [k,v] of Object.entries(EXPAND_KEYS)) {
    const x = style[k as keyof TextStyle];
    if (x == null) continue;
    for (const s of v)
      css[s] = x as never;
  }
  return css;
}

export function clamp(numberOfLines?: number): CSSProperties {
  if (numberOfLines === 1) {
    return {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    };
  }
  if (numberOfLines != null) {
    return {
      display: '-webkit-box',
      overflow: 'hidden',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: numberOfLines,
    };
  }
  return {};
}

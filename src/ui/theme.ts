import '@/ui/global.css';
import type {CSSProperties} from 'react';
import type {ColorValue, TextStyle} from 'react-native';
import {Platform, PlatformColor, useColorScheme} from 'react-native';
import {DefaultTheme} from 'expo-router';
import {TypographyVariant, TypographyStyle} from '@/ui/typography/types';

export type VariantMap = Record<TypographyVariant, TypographyStyle>;
export type ColorTokens = keyof typeof colors[keyof typeof colors];
export type ColorValues = typeof colors[keyof typeof colors];
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

export const colors = {
  light: {
    label: '#000000',
    secondaryLabel: '#60646C',
    tertiaryLabel: '#9094A0',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    separator: 'rgba(60, 60, 67, 0.29)',
    tint: '#208AEF',
    pillBackground: 'rgba(118, 118, 128, 0.12)',
    switchTrack: '#e9e9ea',
  },
  dark: {
    label: '#ffffff',
    secondaryLabel: '#B0B4BA',
    tertiaryLabel: '#6E7378',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    separator: 'rgba(84, 84, 88, 0.6)',
    tint: '#0A84FF',
    pillBackground: 'rgba(118, 118, 128, 0.24)',
    switchTrack: '#39393d',
  },
} as const;

export const theme = {
  label: getPlatformToken({
    ios: () => PlatformColor('label'),
    android: () => PlatformColor('?android:attr/textColorPrimary'),
    web: 'var(--color-label)',
    default: colors.light.label,
  }),
  secondaryLabel: getPlatformToken({
    ios: () => PlatformColor('secondaryLabel'),
    android: () => PlatformColor('?android:attr/textColorSecondary'),
    web: 'var(--color-secondary-label)',
    default: colors.light.secondaryLabel,
  }),
  tertiaryLabel: getPlatformToken({
    ios: () => PlatformColor('tertiaryLabel'),
    android: () => PlatformColor('?android:attr/textColorTertiary'),
    web: 'var(--color-tertiary-label)',
    default: colors.light.tertiaryLabel,
  }),
  background: getPlatformToken({
    ios: () => PlatformColor('systemBackground'),
    android: () => PlatformColor('?android:attr/colorBackground'),
    web: 'var(--color-background)',
    default: colors.light.background,
  }),
  backgroundElement: getPlatformToken({
    ios: () => PlatformColor('secondarySystemBackground'),
    android: () => PlatformColor('?android:attr/colorBackgroundFloating'),
    web: 'var(--color-background-element)',
    default: colors.light.backgroundElement,
  }),
  backgroundSelected: getPlatformToken({
    ios: () => PlatformColor('tertiarySystemBackground'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-background-selected)',
    default: colors.light.backgroundSelected,
  }),
  separator: getPlatformToken({
    ios: () => PlatformColor('separator'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-separator)',
    default: colors.light.separator,
  }),
  tint: getPlatformToken({
    ios: () => PlatformColor('systemBlue'),
    android: () => PlatformColor('?attr/colorPrimary'),
    web: 'var(--color-tint)',
    default: colors.light.tint,
  }),
  pillBackground: getPlatformToken({
    ios: () => PlatformColor('secondarySystemFill'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-pill-background)',
    default: colors.light.pillBackground,
  }),
  switchTrack: getPlatformToken({
    ios: () => PlatformColor('systemGray5'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-switch-track)',
    default: colors.light.switchTrack,
  }),
} as const;

export const nav = {
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
} as const;

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
  footnote: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  caption: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  label: {fontSize: 12, fontWeight: 'medium', lineHeight: 16},
};

export const variants = Platform.select({
  default: iosVars,
  android: androidVars,
  ios: iosVars,
  web: iosVars,
});

/**
 * Resolves a color token to a usable string value.
 *
 * - Web: returns the `var(--color-*)` custom property so theming stays fully
 *   reactive through CSS (driven by `getThemeCSS`), never recomputed in JS.
 * - Native: PlatformColor values are opaque objects that can't be consumed
 *   everywhere (they stringify to "[object Object]" and aren't honored by
 *   expo-symbols glyphs), so resolve a concrete palette color that reacts to
 *   the active light/dark scheme.
 */
export function useColor(token: ColorTokens): string {
  if (Platform.OS === 'web') return theme[token] as string;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Platform.OS is a runtime constant.
  return colors[useColorScheme() === 'dark' ? 'dark' : 'light'][token];
}

export function getPlatformToken(specifics: {
  default: ColorValue;
  android: ColorNative;
  ios: ColorNative;
  web: ColorValue;
}): ColorValue {
  const get = (c: ColorNative) => typeof c === 'function' ? c() : c;
  switch (Platform.OS) {
    case 'ios':
      return get(specifics.ios);
    case 'android':
      return get(specifics.android);
    case 'web':
      return specifics.web;
    default:
      return specifics.default;
  }
}

export function getThemeCSS(): string {
  const format = (s: string) => s.replace(/[A-Z]/g, v => `-${v.toLowerCase()}`);
  const render = (o: ColorValues) => Object.entries(o).map(([k,v]) =>
    `\t\t${`--color-${format(k)}`}: ${v};`).join('\n');
  return `
    :root {
      color-scheme: light dark;
      ${render(colors.light)}
    }
    @media (prefers-color-scheme: dark) {
      :root {
        ${render(colors.dark)}
      }
    }
  `;
}

export function flatten(style?: TextStyle): CSSProperties {
  if (!style) return {};
  const css: CSSProperties = {};
  if (typeof style.opacity === 'number')
    css.opacity = style.opacity;
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

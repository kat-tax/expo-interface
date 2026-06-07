import '@/ui/global.css';

import type {ColorValue} from 'react-native';
import {Platform, PlatformColor, useColorScheme} from 'react-native';
import {Colors} from '@/ui/colors';

export {Colors};

export type SemanticColor =
  | 'label'
  | 'secondaryLabel'
  | 'tertiaryLabel'
  | 'background'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'separator'
  | 'tint'
  | 'pillBackground';

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColorToken = SemanticColor | 'secondary' | 'tertiary';

type NativeColor = ColorValue | (() => ColorValue);

function resolveNativeColor(value: NativeColor): ColorValue {
  return typeof value === 'function' ? value() : value;
}

/** PlatformColor is not available on web — native values are resolved lazily. */
function platformToken(specifics: {
  ios: NativeColor;
  android: NativeColor;
  web: ColorValue;
  default: ColorValue;
}): ColorValue {
  switch (Platform.OS) {
    case 'ios':
      return resolveNativeColor(specifics.ios);
    case 'android':
      return resolveNativeColor(specifics.android);
    case 'web':
      return specifics.web;
    default:
      return specifics.default;
  }
}

export const colors: Record<SemanticColor, ColorValue> = {
  label: platformToken({
    ios: () => PlatformColor('label'),
    android: () => PlatformColor('?android:attr/textColorPrimary'),
    web: 'var(--color-label)',
    default: Colors.light.text,
  }),
  secondaryLabel: platformToken({
    ios: () => PlatformColor('secondaryLabel'),
    android: () => PlatformColor('?android:attr/textColorSecondary'),
    web: 'var(--color-secondary-label)',
    default: Colors.light.textSecondary,
  }),
  tertiaryLabel: platformToken({
    ios: () => PlatformColor('tertiaryLabel'),
    android: () => PlatformColor('?android:attr/textColorTertiary'),
    web: 'var(--color-tertiary-label)',
    default: Colors.light.textTertiary,
  }),
  background: platformToken({
    ios: () => PlatformColor('systemBackground'),
    android: () => PlatformColor('?android:attr/colorBackground'),
    web: 'var(--color-background)',
    default: Colors.light.background,
  }),
  backgroundElement: platformToken({
    ios: () => PlatformColor('secondarySystemBackground'),
    android: () => PlatformColor('?android:attr/colorBackgroundFloating'),
    web: 'var(--color-background-element)',
    default: Colors.light.backgroundElement,
  }),
  backgroundSelected: platformToken({
    ios: () => PlatformColor('tertiarySystemBackground'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-background-selected)',
    default: Colors.light.backgroundSelected,
  }),
  separator: platformToken({
    ios: () => PlatformColor('separator'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-separator)',
    default: Colors.light.separator,
  }),
  tint: platformToken({
    ios: () => PlatformColor('systemBlue'),
    android: () => PlatformColor('?attr/colorPrimary'),
    web: 'var(--color-tint)',
    default: Colors.light.tint,
  }),
  pillBackground: platformToken({
    ios: () => PlatformColor('secondarySystemFill'),
    android: () => PlatformColor('?android:attr/colorControlHighlight'),
    web: 'var(--color-pill-background)',
    default: Colors.light.pillBackground,
  }),
};

export function resolveColorToken(token: ThemeColorToken): ColorValue {
  switch (token) {
    case 'secondary':
      return colors.secondaryLabel;
    case 'tertiary':
      return colors.tertiaryLabel;
    default:
      return colors[token];
  }
}

/**
 * Theme-aware semantic colors. On every platform the underlying values
 * (`PlatformColor` on native, CSS vars on web) resolve to the active light/dark
 * scheme automatically, so this is just a stable accessor for the `colors` map.
 */
export function useThemeColors(): Record<SemanticColor, ColorValue> {
  return colors;
}

export function usePalette() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({
  ios: 50,
  android: 80,
}) ?? 0;

export const TopBarInset = Platform.select({
  web: 80,
}) ?? 0;

export const BoxMaxWidth = 800;

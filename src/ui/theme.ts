import '@/ui/global.css';
import type {ColorValue} from 'react-native';
import {Platform, PlatformColor, useColorScheme} from 'react-native';

export type ColorTokens = keyof typeof colors[keyof typeof colors];
export type ColorValues = typeof colors[keyof typeof colors];
export type ColorNative = ColorValue | (() => ColorValue);

export const fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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

export const boundaries = {
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
} as const;

export function usePalette() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
}

export function getPlatformToken(specifics: {
  web: ColorValue;
  ios: ColorNative;
  android: ColorNative;
  default: ColorValue;
}): ColorValue {
  const get = (v: ColorNative) =>
    typeof v === 'function' ? v() : v;
  switch (Platform.OS) {
    case 'ios':
      return get(specifics.ios);
    case 'android':
      return get(specifics.android);
    case 'web': // not supported (yet)
      return specifics.web;
    default:
      return specifics.default;
  }
}

export function getWebColorCss(): string {
  const format = (val: string) =>
    val.replace(/[A-Z]/g, v =>
      `-${v.toLowerCase()}`);

  const render = (obj: ColorValues) =>
    Object.entries(obj).map(([k,v]) =>
      `\t${`--color-${format(k)}`}: ${v};`).join('\n');

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

export function getColorToken(color: ColorTokens | (string & {})): ColorValue {
  return color in theme
    ? theme[color as ColorTokens]
    : color;
}

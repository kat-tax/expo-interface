import type {ColorValue} from 'react-native';
import type {ThemeColorToken} from '@/theme';
import {Fonts, resolveColorToken} from '@/theme';

const colorTokens = new Set<string>([
  'label',
  'secondary',
  'tertiary',
  'secondaryLabel',
  'tertiaryLabel',
  'background',
  'backgroundElement',
  'backgroundSelected',
  'separator',
  'tint',
]);

export function resolveTypographyColor(color: ThemeColorToken | string): ColorValue {
  return colorTokens.has(color)
    ? resolveColorToken(color as ThemeColorToken)
    : color;
}

export const fontFamily = Fonts?.sans;

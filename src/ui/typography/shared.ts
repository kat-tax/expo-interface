import type {ColorValue} from 'react-native';
import type {ColorTokens} from '@/ui/theme';
import {fonts, resolveColorToken} from '@/ui/theme';

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

export function resolveTypographyColor(color: ColorTokens | string): ColorValue {
  return colorTokens.has(color)
    ? resolveColorToken(color as ColorTokens)
    : color;
}

export const fontFamily = fonts?.sans;

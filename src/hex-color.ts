import {processColor} from 'react-native';

/**
 * A color in any form React Native accepts (a name, `rgb()`, `hsl()`, a
 * short or long hex) as `#RRGGBBAA`; `undefined` for anything it cannot
 * read, a platform color or a CSS variable among them. What a XAML island's
 * color props parse, and what a black-or-white contrast can be worked out
 * from.
 */
export function hexColor(color: string | undefined): string | undefined {
  const argb = color == null ? null : processColor(color);
  if (typeof argb !== 'number') return undefined;
  const rgba = ((argb << 8) | (argb >>> 24)) >>> 0;
  return `#${rgba.toString(16).padStart(8, '0').toUpperCase()}`;
}

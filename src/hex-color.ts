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

/**
 * `color` as it shows over `under`, as an opaque `#RRGGBBFF`: a translucent
 * color blended into what is beneath it by its alpha, which is what the eye
 * sees and so what a black-or-white contrast has to be worked out from.
 * `undefined` when `color` cannot be read; an `under` that cannot be read
 * leaves `color` as it is, without its alpha.
 */
export function hexOver(color: string | undefined, under: string): string | undefined {
  const top = hexColor(color);
  if (top === undefined) return undefined;
  const bottom = hexColor(under) ?? top;
  const alpha = parseInt(top.slice(7), 16) / 255;
  const channel = (at: number) => {
    const mixed = Math.round(parseInt(top.slice(at, at + 2), 16) * alpha + parseInt(bottom.slice(at, at + 2), 16) * (1 - alpha));
    return mixed.toString(16).padStart(2, '0').toUpperCase();
  };
  return `#${channel(1)}${channel(3)}${channel(5)}FF`;
}

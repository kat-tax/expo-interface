import './symbol.css';
import type {CSSProperties} from 'react';
import type {IconToken} from '../icons';
import {FontDisplay, loadAsync} from 'expo-font';
import regular from 'expo-symbols/androidWeights/regular';

export interface SymbolProps {
  /** Icon to draw. Its `fill` picks the solid form. */
  icon: IconToken;
  /**
   * Glyph size in pixels.
   * @default 24
   */
  size?: number;
  /** Color of the glyph. Defaults to the inherited text color. */
  tintColor?: string;
}

/**
 * The static Material Symbols instance `expo-symbols` ships, registered here
 * because the kit draws the glyph itself rather than through `SymbolView`.
 * `block` rather than the default `auto`, so the ligature — the icon's name —
 * is never painted as words while the font loads.
 *
 * `loadAsync` writes the `@font-face` synchronously and returns the browser's
 * *verification* of the family, which nothing here waits on; `allSettled`
 * keeps a check that fails (or never answers) from surfacing as an unhandled
 * rejection, leaving the icon unpainted exactly as `SymbolView` would.
 */
void Promise.allSettled([
  loadAsync({[regular.name]: {uri: regular.font, display: FontDisplay.BLOCK}}),
]);

/**
 * Draws an `IconToken` on web as a Material Symbols ligature in a `<span>`,
 * so the fill axis is reachable from CSS (`symbol.css`) and the glyph lays out
 * as inline content of the control around it.
 *
 * The span is `aria-hidden`: the ligature is the icon's name in text, which
 * would otherwise land in the accessible name of every button it sits in.
 */
export function Symbol({icon, size = 24, tintColor}: SymbolProps) {
  const {symbol, fill} = icon;
  // A bare string names an SF Symbol, which has no Material equivalent to
  // draw; `SymbolView` renders its fallback there and so does this.
  const glyph = typeof symbol === 'object' ? symbol.web : undefined;
  if (!glyph) return null;
  return (
    <span
      aria-hidden="true"
      translate="no"
      className={fill ? 'ui-symbol ui-symbol--filled' : 'ui-symbol'}
      style={{fontSize: size, color: tintColor} as CSSProperties}>
      {glyph}
    </span>
  );
}

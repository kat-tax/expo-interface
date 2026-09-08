import './symbol.css';
import type {CSSProperties} from 'react';
import type {IconToken} from '../icons';
import {Asset} from 'expo-asset';
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

/** The element the `@font-face` lives in, and the guard against a second one. */
const FONT_STYLE_ID = 'expo-interface-symbol-font';

/**
 * Registers the static Material Symbols instance `expo-symbols` ships: the
 * family `symbol.css` draws with, since the kit writes the glyph itself rather
 * than letting `SymbolView` load it.
 *
 * The rule is written by hand rather than through `expo-font`'s `loadAsync`,
 * which writes the same one and then starts a `fontfaceobserver` poll to
 * *verify* the family. Nothing here waits on that: it outlives a jsdom test
 * environment (an uncaught `TypeError` in a timer, long after the test that
 * started it), and on a static render `loadAsync` throws outright — "expo-font
 * server context accessed outside of withServerContext()" — because a page's
 * fonts are collected while its route renders, not when a module is imported.
 * All the kit wants is the rule.
 *
 * `font-display: block` rather than the default `auto`, so the ligature — the
 * icon's name — is never painted as words while the font loads.
 *
 * @returns whether the rule was written. `false` where it is already there, or
 * where there is no document to write it to: a static render, which paints
 * nothing and hands the page to a browser that runs this on import.
 */
export function registerSymbolFont(doc: Document | undefined = globalThis.document): boolean {
  if (!doc || doc.getElementById(FONT_STYLE_ID)) return false;
  const style = doc.createElement('style');
  style.id = FONT_STYLE_ID;
  const {uri} = Asset.fromModule(regular.font);
  style.textContent = `@font-face{font-family:${JSON.stringify(regular.name)};src:url(${JSON.stringify(uri)});font-display:block}`;
  doc.head.append(style);
  return true;
}

// On import, so the family is in place before the first paint.
registerSymbolFont();

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

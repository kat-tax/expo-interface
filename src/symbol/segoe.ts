import type {IconToken} from '../icons';
import {SEGOE_GLYPHS} from './segoe.generated';

export {SEGOE_GLYPHS};

/**
 * The Segoe Fluent Icons code point (`E72D`) an icon token draws on Windows:
 * the token's own `windows` glyph, or the one `SEGOE_GLYPHS` keeps for its
 * Material name (`android`, then `web`) — the table `scripts/segoe-glyphs.ts`
 * generates from the Material Symbols names and the Segoe catalogue, twins
 * matched by name and curated by hand. `undefined` where there is none — a
 * bare SF Symbol name, or a Material name the table has not met — and the
 * component draws nothing, as `SymbolView` does with no glyph.
 *
 * Where the family has a solid form of the glyph it is the table's second
 * entry; `fill` picks it, and falls back to the outline where there is none —
 * the same quiet fallback the web has without the variable font.
 */
export function windowsGlyph(token: IconToken): string | undefined {
  const {symbol, fill} = token;
  if (typeof symbol !== 'object') return undefined;
  if ('windows' in symbol && symbol.windows) return symbol.windows;
  const entry = (symbol.android && SEGOE_GLYPHS[symbol.android]) ?? (symbol.web && SEGOE_GLYPHS[symbol.web]);
  if (!entry) return undefined;
  return fill ? entry[1] ?? entry[0] : entry[0];
}

/** The glyph as the character a `Text` draws: `E72D` → ``. */
export function glyphChar(codePoint: string): string {
  return String.fromCodePoint(parseInt(codePoint, 16));
}

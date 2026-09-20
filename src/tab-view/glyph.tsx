import type {GlyphProps} from './shared';
import {SymbolView} from 'expo-symbols';

/**
 * The glyph the drawn strip and switcher use on iOS and Android:
 * `SymbolView`, which is the kit's cross-platform icon on those two — an SF
 * Symbol on iOS, a Material Symbol on Android.
 *
 * It is not `Icon`, which is the web and Windows one: that draws the name as a
 * ligature in a `<span>`, which on a native platform is a string outside a
 * `<Text>` and a render that throws.
 */
export function Glyph({icon, size, tintColor}: GlyphProps) {
  return <SymbolView name={icon.symbol} size={size} tintColor={tintColor}/>;
}

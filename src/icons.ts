import type {ImageSourcePropType} from 'react-native';
import type {AndroidSymbol, SFSymbol, SymbolViewProps} from 'expo-symbols';

/**
 * The symbol an icon token names: an `expo-symbols` name, either a bare SF
 * Symbol or a per-platform map. `windows` is a Segoe Fluent Icons code point
 * (`E72D`); without it Windows draws the Fluent twin of the Material name
 * (see `symbol/segoe.ts`).
 */
export type IconSymbol =
  | SymbolViewProps['name']
  | {ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol; windows?: string};

/**
 * A platform-agnostic icon reference consumed by `Button` and friends.
 *
 * - `symbol`: the `expo-symbols` name, either a single string or a
 *   `{ios, android, web}` map (SF Symbol on iOS, Material Symbol elsewhere),
 *   optionally with a `windows` Segoe Fluent Icons code point.
 * - `drawable`: optional Android drawable (for example an
 *   `@expo/material-symbols/<name>.xml` import) used by Jetpack Compose
 *   controls, which render drawables rather than symbol glyphs.
 * - `fill`: the solid form of the symbol rather than the outline — the star a
 *   favourite gets, the heart a like. See `icon()` for what each platform
 *   needs to draw it.
 */
export interface IconToken {
  symbol: IconSymbol;
  drawable?: ImageSourcePropType;
  fill?: boolean;
}

/**
 * Builds an `IconToken`. Keep Android drawables in a `.android.ts` file so
 * the XML assets are only bundled on Android:
 *
 * ```ts
 * // icons.drawables.android.ts
 * import share from '@expo/material-symbols/share.xml';
 * export const drawables = {share};
 *
 * // icons.drawables.ts (iOS/web stub)
 * export const drawables: Record<string, ImageSourcePropType | undefined> = {};
 *
 * // icons.ts
 * export const share = icon(
 *   {ios: 'square.and.arrow.up', android: 'share', web: 'share'},
 *   drawables.share,
 * );
 * ```
 *
 * `fill` asks for the solid form of the same symbol, so a toggle names its
 * icon once rather than twice:
 *
 * ```ts
 * export const starFilled = icon(
 *   {ios: 'star', android: 'star', web: 'star'},
 *   drawables.star_filled,
 *   {fill: true},
 * );
 * ```
 *
 * Each platform draws it from what it has: iOS appends SF Symbols' own
 * `.fill` suffix, web sets the `FILL 1` axis of the Material Symbols variable
 * font (see the README — an app registers the family), Jetpack Compose
 * draws the `drawable`, which has to be the filled vector
 * (`npx add-material-symbols --fill star`) because Compose renders XML
 * drawables rather than font glyphs, and Windows draws the Segoe Fluent
 * Icons glyph the Material name maps to — or the token's own `windows` code
 * point (`{..., windows: 'E72D'}`) for a name the map has not met.
 */
export function icon(
  symbol: IconSymbol,
  drawable?: ImageSourcePropType,
  options?: {fill?: boolean},
): IconToken {
  return {symbol, drawable, fill: options?.fill};
}

import type {ImageSourcePropType} from 'react-native';
import type {SymbolViewProps} from 'expo-symbols';

/**
 * A platform-agnostic icon reference consumed by `Button` and friends.
 *
 * - `symbol`: the `expo-symbols` name, either a single string or a
 *   `{ios, android, web}` map (SF Symbol on iOS, Material Symbol elsewhere).
 * - `drawable`: optional Android drawable (for example an
 *   `@expo/material-symbols/<name>.xml` import) used by Jetpack Compose
 *   controls, which render drawables rather than symbol glyphs.
 */
export interface IconToken {
  symbol: SymbolViewProps['name'];
  drawable?: ImageSourcePropType;
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
 */
export function icon(
  symbol: SymbolViewProps['name'],
  drawable?: ImageSourcePropType,
): IconToken {
  return {symbol, drawable};
}

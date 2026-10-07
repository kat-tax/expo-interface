import type {ImageSourcePropType} from 'react-native';
import type {AndroidSymbol, SFSymbol, SymbolViewProps} from 'expo-symbols';
import type {ColorTokens} from './theme';
import {windowsGlyph} from './symbol/segoe';

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
 *   controls, which render drawables rather than symbol glyphs. Left out,
 *   the drawable comes from the registry (`registerDrawables`).
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
 * The color an icon is drawn in, as a role rather than a value: the label
 * color, the secondary or tertiary text colors, the accent, or the green
 * and red of a state. `Icon` takes one, and so does a `ListItem`'s icon.
 */
export type IconTone = 'label' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'destructive';

/** The palette token each tone draws in. */
export const TONE_TOKEN: Record<IconTone, ColorTokens> = {
  label: 'label',
  secondary: 'secondaryLabel',
  tertiary: 'tertiaryLabel',
  accent: 'tint',
  success: 'success',
  destructive: 'destructive',
};

/** The platforms a token names an icon for. */
export type IconPlatform = 'ios' | 'android' | 'web' | 'windows';

/**
 * Builds an `IconToken`. Keep Android drawables in an `.android.ts` file so
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
 * Or register the drawables once, by their Material names, and leave the
 * tokens to find their own (`registerDrawables`); `expo-interface-symbols`
 * writes that file from the names an app uses.
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

/** The Material Symbols name a token carries: its Android name, else its web name. */
export function materialName(token: IconToken): AndroidSymbol | undefined {
  const {symbol} = token;
  if (typeof symbol !== 'object') return undefined;
  return symbol.android ?? symbol.web;
}

/**
 * The name a token draws on a platform: the SF Symbol on iOS (its `.fill`
 * form for a filled token), the Material name on Android and the web, the
 * Segoe Fluent Icons code point on Windows. `undefined` where the token
 * names nothing for the platform, which is where the kit draws nothing.
 */
export function symbolName(token: IconToken, platform: IconPlatform): string | undefined {
  const {symbol, fill} = token;
  switch (platform) {
    case 'ios': {
      const name = typeof symbol === 'string' ? symbol : symbol.ios;
      if (!name) return undefined;
      return fill && !name.endsWith('.fill') ? `${name}.fill` : name;
    }
    case 'android':
      return typeof symbol === 'object' ? symbol.android : undefined;
    case 'web':
      return typeof symbol === 'object' ? symbol.web : undefined;
    case 'windows':
      return windowsGlyph(token);
  }
}

type Drawables = Readonly<Record<string, ImageSourcePropType | undefined>>;

let outlined: Drawables = {};
let filled: Drawables = {};

/**
 * Registers the Android drawables the app's tokens draw with, by their
 * Material names, once at startup: the outlined vectors, and the filled ones
 * for the tokens that ask for `fill`. A token with a `drawable` of its own
 * keeps it; one without finds its name here. `expo-interface-symbols` writes
 * the module this takes, from the names used in the app's sources, so an
 * app lists no drawable by hand.
 *
 * ```ts
 * import {registerDrawables} from 'expo-interface';
 * import {drawables, filledDrawables} from './symbols/drawables';
 *
 * registerDrawables(drawables, filledDrawables);
 * ```
 */
export function registerDrawables(drawables: Drawables, filledDrawables: Drawables = {}): void {
  outlined = {...outlined, ...drawables};
  filled = {...filled, ...filledDrawables};
}

/**
 * The Android drawable a token draws: its own, or the one registered under
 * its Material name, the filled one for a filled token. `undefined` where
 * there is none, which is where Compose draws nothing.
 */
export function drawableOf(token: IconToken | undefined): ImageSourcePropType | undefined {
  if (!token) return undefined;
  if (token.drawable) return token.drawable;
  const name = materialName(token);
  if (!name) return undefined;
  return token.fill ? filled[name] ?? outlined[name] : outlined[name];
}

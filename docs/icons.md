# Icons

[Docs home](README.md)

Each platform draws icons from its own family: SF Symbols, Material Symbols or
Segoe Fluent Icons. An `IconToken` names the same icon in each.

Icon props take an `IconToken` from `icon()`: an `expo-symbols` name, or a
`{ios, android, web}` map, plus an optional Android drawable.

| Platform | What draws the icon |
| --- | --- |
| iOS | SF Symbols through `expo-symbols` |
| Android | Material Symbols as XML vector drawables from `@expo/material-symbols`. Compose renders drawables, not font glyphs. |
| Web | The Material Symbols web font. The name is written as text and the font's ligature draws the glyph. |
| Windows | Segoe Fluent Icons: the Fluent twin of the Material name from `SEGOE_GLYPHS`, or the code point the token names with `windows: 'E72D'`. |

Keep drawables in an `.android.ts` file so the XML is only bundled there:

```ts
// icons.drawables.android.ts
import share from '@expo/material-symbols/share.xml';
export const drawables = {share};

// icons.drawables.ts
export const drawables: Record<string, ImageSourcePropType | undefined> = {};

// icons.ts
import {icon} from 'expo-interface';
import {drawables} from './icons.drawables';
export const share = icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'}, drawables.share);
```

A token with no glyph on a platform draws nothing there: a bare SF Symbol
name on Android, web and Windows, or a Material name the Segoe table has not
met.

## Filled icons

`fill: true` asks for the solid form of the same symbol, so a toggle names its
icon once:

```ts
export const star = icon({ios: 'star', android: 'star', web: 'star'}, drawables.star);
export const starFilled = icon({ios: 'star', android: 'star', web: 'star'}, drawables.star_fill, {fill: true});
```

| Platform | How a filled token draws | What the app provides |
| --- | --- | --- |
| iOS | SF Symbols' own `.fill` name (`star` becomes `star.fill`). A token that already names a solid symbol keeps it. | Nothing |
| Android | The token's `drawable`, which has to be the filled vector | `npx add-material-symbols --fill star` |
| Web | The `FILL 1` axis of the Material Symbols variable font | The variable family, registered under `Material Symbols Outlined` or under a name of the app's own in `--ui-symbol-font` |
| Windows | The family's solid glyph, where it has one; otherwise the outline | Nothing |

`expo-symbols` bundles a static Material Symbols font cut at `FILL 0` with no
variable axes, so filled icons on web need the variable family:

```css
@font-face {
  font-family: 'Material Symbols Outlined';
  src: url('./assets/MaterialSymbolsOutlined.woff2') format('woff2-variations');
  font-weight: 100 700;
  font-display: block;
}
```

Serve it from the app's own bundle so an offline web build still draws.
Without the family a filled token draws its outline.

## Windows glyphs

`SEGOE_GLYPHS` maps Material Symbols names to Segoe Fluent Icons code points.
`scripts/segoe-glyphs.ts` generates it from the names `expo-symbols` types
and the Segoe Fluent Icons catalogue: a name whose tokens match a Segoe name
is that glyph (`zoom_in` is `ZoomIn`), a singular and plural pair counts when
it is the only candidate, a name that is another name plus one of Material's
variant suffixes (`_2`, `_alt`, `_outline`, `_filled` and the rest) takes its
base's glyph, and a curated list names the twins the names alone do not find
(`arrow_back` is `Back`, `favorite` is `Heart`) or find wrongly (`pin` is the
PIN pad, not the pushpin). Where the family has a solid form it is the filled
glyph.

The two catalogues differ in size (about four thousand Material names against
fifteen hundred Segoe glyphs), so the table cannot cover every name. A test
fails when a Material name used anywhere in the kit, its stories or the
example has no glyph, and its message names the glyphs worth choosing from.
Add the name to `CURATED` in the script and run `bun run segoe:windows`, or
give the token its own code point:

```ts
export const drop = icon({ios: 'shippingbox', android: 'inventory_2', web: 'inventory_2', windows: 'E7B8'}, drawables.inventory_2);
```

`windowsGlyph(token)` answers the code point a token draws.

## The `Icon` component

The kit's `Icon` draws a token as a font glyph on web (a `<span>` holding the
ligature, `aria-hidden`) and on Windows (a `Text` in Segoe Fluent Icons,
hidden from accessibility). It exists for those two platforms only; on iOS and
Android the kit uses `SymbolView` directly.

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
| Web | The `FILL 1` axis of the Material Symbols variable font | The variable family, registered under `Material Symbols Outlined` or, for filled icons alone, `Material Symbols Filled`, or under a name of the app's own in `--ui-symbol-font` or `--ui-symbol-fill-font` |
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

Registered as `Material Symbols Outlined`, the variable family is the one
every icon draws with first. Registered as `Material Symbols Filled`, it is
the one a filled token draws with first, and outlined icons keep the static
instance. The stylesheet's stacks:

| Token | Families, in order |
| --- | --- |
| Outlined | `--ui-symbol-font` (`Material Symbols Outlined`), then the static instance |
| Filled | `--ui-symbol-fill-font` (`Material Symbols Filled`), then `--ui-symbol-font` (`Material Symbols Outlined`), then the static instance |

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

`Icon` draws a token on its own, on every platform: `SymbolView`'s SF Symbol
on iOS and Material Symbol on Android, a `<span>` holding the Material
ligature on web, a `Text` in Segoe Fluent Icons on Windows. Props: `icon`,
`size` (24), `tone` (`label`, `secondary`, `tertiary`, `accent`, `success`,
`destructive`; the color's role, `label` by default), `tintColor` (a color
of its own, over the tone), `testID`.

```tsx
<Icon icon={icons.check} tone="success" size={16}/>
```

The glyph is hidden from assistive technology on every platform: an icon on
its own says nothing, and the control or row around it carries the name. On
iOS and Android it is a React Native view, so it goes in a React Native
layout; inside a host the controls draw their own icons. A filled token
draws its outline on Android here, as `SymbolView` draws from the static
font; the controls draw the filled vector.

## Resolving names

`symbolName(token, platform)` answers what a token draws on `ios` (the
`.fill` form for a filled token), `android`, `web` or `windows` (the Segoe
code point), or `undefined` where it draws nothing. `materialName(token)`
is the Material name, Android's then the web's.

A tab route takes a token too: `Tabs routes` accept an `IconToken` in place
of the per-platform names, and `webIcon` takes one for the app's mark,
drawn as the kit's glyph in the label color; an image mark is drawn as it
is, or in the label color with `webTintIcon`.

## Drawables without a list

Instead of passing a drawable to every token, register them once by their
Material names and let each token find its own:

```ts
import {registerDrawables} from 'expo-interface';
import {drawables, filledDrawables} from './symbols/drawables';

registerDrawables(drawables, filledDrawables);
export const share = icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'});
```

`expo-interface-symbols` writes that module from the names an app's sources
use, and the filled vectors beside it:

```sh
npx expo-interface-symbols            # reads src and app, writes src/symbols
npx expo-interface-symbols app --out app/symbols --font
```

It imports each outlined vector from `@expo/material-symbols` where the
package ships it and downloads the rest from Google Fonts, downloads the
`fill` form of every token that asks for one, and writes
`drawables.android.ts` with the two maps and a `drawables.ts` stub for the
other platforms. The names the kit's own controls draw on Android are
written whether or not the sources name them:

| Name | Drawn by |
| --- | --- |
| `arrow_back` | the back button of a `Sheet`'s bar |
| `close` | the close button of a `Sheet`'s bar and a `FindBar`'s close |
| `more_horiz` | a `Sheet`'s and a `Card`'s menu, and a `Toolbar`'s overflow |
| `arrow_upward`, `stop` | a `Composer`'s send and stop buttons |
| `keyboard_arrow_up`, `keyboard_arrow_down` | a `FindBar`'s previous and next match |
| `star` | a `Card`'s favorite, outlined and, while set, filled |

A token's own `drawable` still wins. `drawableOf(token)` is the lookup the
kit's Android controls use.

## The web font

`--font` also writes `MaterialSymbolsOutlined.woff2`: the variable Material
Symbols font cut down to the ligatures of the names found, the `fill` names,
and the names the kit's own controls draw on the web. Those are the eight
listed above, plus `add` and `grid_view` for a `TabView` strip and `search`
for `HeaderSearch`. The font draws most solid icons from a glyph of their
own, so the cut keeps each name's glyph at `FILL 0` and at `FILL 1`. It
keeps the `FILL` axis and pins the others. A name the font does not have is
reported and left out. The cut is done with HarfBuzz, so the CLI needs
`harfbuzzjs` 1 and `fontverter` in the app (`npm i -D harfbuzzjs fontverter`).

Serve it from the app's bundle and register it beside the palette:

```tsx
// app/+html.tsx
<style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2')}}/>
```

Registered that way, every icon draws from the cut first. The cut maps
every letter its names use, so a name it does not hold draws as its letters
rather than falling back to the static instance. A name the app builds at
run time therefore has to appear in a token in the sources, as Android's
drawables already require. Registered with `{filled: true}`, the cut is
`Material Symbols Filled`, which the stylesheet tries first for a filled
token only. Outlined icons then keep the static instance `expo-symbols`
ships, which holds every name. A filled token draws from the cut under
either registration, so its name has to be in the cut as well.

`getSymbolFontCSS(url, options?)` is the `@font-face` the stylesheet draws
with. Its options:

| Option | What it does |
| --- | --- |
| `filled` | Registers the font as `Material Symbols Filled` (`SYMBOL_FILL_FONT_FAMILY`), which the stylesheet tries first for a filled token only. `false` by default, which registers it as `Material Symbols Outlined` (`SYMBOL_FONT_FAMILY`), the family every icon tries first. |
| `family` | A family of the app's own, which then also goes in `--ui-symbol-font`, or in `--ui-symbol-fill-font` with `filled`. |

A family name in place of the options is the same as `{family}`.

```tsx
// for filled icons alone
<style dangerouslySetInnerHTML={{__html: getThemeCSS() + getSymbolFontCSS('/symbols/MaterialSymbolsOutlined.woff2', {filled: true})}}/>
```

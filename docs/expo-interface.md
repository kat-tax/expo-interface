# expo-interface

`expo-interface` is a UI kit for Expo apps. Every component renders the
platform's own control: SwiftUI on iOS and Jetpack Compose on Android through
`@expo/ui`, the DOM on web, and WinUI 3 on Windows through
react-native-windows. One accent color seeds the theme on every platform,
screens follow the system's light or dark scheme, and a screen written once
looks native on all four without per-platform styling.

| Platform | Controls | Through |
| --- | --- | --- |
| iOS | SwiftUI | `@expo/ui/swift-ui` |
| Android | Jetpack Compose, Material 3 | `@expo/ui/jetpack-compose` |
| Web | Real DOM elements, with CSS beside each component | react-native-web for layout |
| Windows | WinUI 3 controls hosted in XAML islands | The kit's own C++/WinRT library, `windows/ExpoInterface`, in a react-native-windows app. The platform itself comes from [expo-windows](expo-windows.md). |

This document describes every feature of the kit and where the platforms
differ. The [README](../README.md) has the short version.

## Versions

Expo SDK 57 (React Native 0.86.3) and `@expo/ui` 57.0.18. The Windows files
use react-native-windows' Fabric API and are built and tested in a
react-native-windows 0.84 app with Expo 57's JavaScript, since no
react-native-windows pairs with React Native 0.86 yet. See
[expo-windows](expo-windows.md#versions).

## How the kit is built

- A component is one directory with `types.ts` and a file per platform:
  `index.tsx`, `index.ios.tsx`, `index.android.tsx`, `index.web.tsx`,
  `index.windows.tsx`. A platform without its own file uses `index.tsx`.
- Where a platform has the control, the kit hosts it. Where it does not, the
  kit draws it with that platform's metrics, and this document says so.
- A prop a platform cannot honour is documented as absent there. Nothing is
  faked.
- Value controls are controlled: `value` pairs with `onValueChange`.
- Nothing of `@expo/ui`, `expo-image`, `expo-symbols`, `expo-web-browser` or
  `expo-system-ui` is imported by a Windows file. A test imports the whole
  package with those modules forbidden.

## Setup

```sh
npx expo install expo-interface @expo/ui @expo/material-symbols
```

The peer dependencies are standard Expo modules that most Expo Router apps
already have: `expo-router`, `expo-symbols`, `expo-asset`, `expo-image`,
`expo-constants`, `expo-status-bar`, `expo-system-ui`, `expo-web-browser` and
`react-native-safe-area-context`. `react-native-keyboard-controller` is an
optional peer for `KeyboardBar`.

1. Wrap the app in `AccentProvider` and use the kit's `Stack` in the root
   layout. `seed` is any hex color; the default is `#007AFF`.

   ```tsx
   // app/_layout.tsx
   import {ThemeProvider} from 'expo-router';
   import {AccentProvider, Stack, useNavTheme} from 'expo-interface';

   function Navigation() {
     return (
       <ThemeProvider value={useNavTheme()}>
         <Stack screenOptions={{headerShown: false}}/>
       </ThemeProvider>
     );
   }

   export default function Layout() {
     return (
       <AccentProvider seed="#8959EA">
         <Navigation/>
       </AccentProvider>
     );
   }
   ```

2. On web, emit the palette as CSS variables in the root HTML, and the boot
   script that applies a scheme the user forced before the bundle runs.

   ```tsx
   // app/+html.tsx
   import {ScrollViewStyleReset} from 'expo-router/html';
   import {getThemeBootScript, getThemeCSS} from 'expo-interface';

   export default function Root({children}: React.PropsWithChildren) {
     return (
       <html lang="en">
         <head>
           <meta charSet="utf-8"/>
           <meta name="viewport" content="width=device-width, initial-scale=1"/>
           <style dangerouslySetInnerHTML={{__html: getThemeCSS()}}/>
           <script dangerouslySetInnerHTML={{__html: getThemeBootScript()}}/>
           <ScrollViewStyleReset/>
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

3. On Android, Jetpack Compose draws icons from XML vector drawables, which
   `@expo/material-symbols` provides. Register the extension in
   `metro.config.js`:

   ```js
   const {getDefaultConfig} = require('expo/metro-config');
   const config = getDefaultConfig(__dirname);
   config.resolver.assetExts.push('xml');
   module.exports = config;
   ```

4. Build screens.

   ```tsx
   import {Screen, FieldGroup, Switch, Button} from 'expo-interface';

   export default function Home() {
     return (
       <Screen native>
         <FieldGroup>
           <FieldGroup.Section title="Sync">
             <Switch label="Notifications" value={on} onValueChange={setOn}/>
             <Button label="Continue" onPress={save}/>
           </FieldGroup.Section>
         </FieldGroup>
       </Screen>
     );
   }
   ```

Windows needs `expo-windows` in the app as well. See its
[document](expo-windows.md#setup).

## Hosts

On iOS and Android a native control lives inside an `@expo/ui` host, and the
kit seeds every host with the accent. `Screen native` mounts one host around a
whole screen. Where a screen cannot be native (a canvas, an editor, a list of
React Native rows), `NativeHost` mounts one around a group of controls.

| Prop | `NativeHost` |
| --- | --- |
| `fit` | Size the host to its content on both axes. By default only the height fits and the width fills the container. |
| `onLayoutContent` | Reports the content's laid-out size, for a parent that lays out before the platform has measured (a stack header). |
| `pointerEvents` | `none` for a host that only presents something and should not take presses. |

`useNativeHost()` answers whether there is a host above. Hosts cannot nest, so
components that present natively mount a host of their own only when there is
none: `Alert` and `Spinner` check; `PopupMenu`, `Fab` (iOS and Android),
`ShareLink` (iOS) and `EmptyState` (iOS 17 and later) mount one where they
need it, and `Toast` and `Toolbar` do the same for their native parts.

On web the host is a plain view that carries the `@expo/ui` palette. On
Windows there is no `@expo/ui` host: every kit control is a React Native view
or a XAML island of its own, and `NativeHost` is a plain view that keeps the
contract (`useNativeHost()` answers true below it, `fit` hugs the content,
`onLayoutContent` reports the size).

## Theme

### Accent

`AccentProvider` takes one hex `seed` and applies it everywhere.

| Platform | How the seed is applied |
| --- | --- |
| iOS | Verbatim as the SwiftUI `tint` of every host, like a single-color AccentColor asset. |
| Android | The Compose host generates a full Material 3 palette from the seed (the Material You algorithm). |
| Web | `--color-tint` and `--color-on-tint` custom properties on the root element, so every CSS consumer updates without a re-render. |
| Windows | Every XAML island takes the seed through its own `accentColor` prop and overrides WinUI's accent brushes from it. |

`useAccentSeed()` returns the active seed. `onAccent(seed)` returns black or
white for content drawn on top of it.

### Color scheme

`useColorScheme()` answers `'light'` or `'dark'` from one stable subscription.
React Native's own hook re-subscribes on every render and, on web, can miss
the `matchMedia` event when an ancestor re-renders during it. Every kit
component follows this hook.

`setColorScheme('system' | 'light' | 'dark')` forces a scheme or follows the
system again.

| Platform | What `setColorScheme` does |
| --- | --- |
| iOS, Android | `Appearance.setColorScheme`. |
| Web | Writes the forced palette on the root element with `color-scheme` and `data-theme`, notifies every `Appearance` listener, and saves the choice in `localStorage` so `getThemeBootScript()` applies it before the bundle runs. `getThemeCSS()` carries the matching `:root[data-theme]` palettes. |
| Windows | Keeps the forced scheme in JavaScript, as on web, so every island follows it through its `theme` prop, and asks `Appearance.setColorScheme` as well for what react-native-windows draws itself. |

`getColorSchemeMode()` answers the forced mode on web and Windows and
`'system'` natively, where the forced scheme is `Appearance`'s own.

### Tokens

| Token | Use |
| --- | --- |
| `label` | Primary text: titles, body copy and row labels |
| `secondaryLabel` | Secondary text: subtitles, captions and supporting text |
| `tertiaryLabel` | Placeholders, disabled hints and decorative glyphs such as chevrons |
| `background` | Screen background behind all content |
| `backgroundElement` | Raised or inset surfaces: cards, sheets and grouped list rows |
| `backgroundSelected` | Background of a selected or pressed element |
| `separator` | Hairline separators between rows and borders around controls |
| `pillBackground` | Track behind pill-shaped controls: pickers, segments, steppers |
| `segmentSelected` | Raised segment of a segmented control, sitting on that track |
| `tint` | Interactive elements such as buttons, switches and links; the accent seed |
| `onTint` | Text and icons drawn on top of `tint` |
| `switchTrack` | Track of a switch in the off position |
| `switchOn` | Success states such as a completed upload |
| `destructive` | Delete buttons, failed states and other destructive actions |
| `onDestructive` | Text and icons drawn on top of `destructive` |

Each token resolves to a platform value the OS keeps current:

| Platform | `theme.<token>` resolves to |
| --- | --- |
| iOS | A `PlatformColor` (the iOS system colors) |
| Android | A theme attribute |
| Web | A `var(--color-*)` custom property |
| Windows | A Fluent theme resource where one matches: `label` is `TextFillColorPrimary`, `background` is `SolidBackgroundFillColorBase`, `separator` is `ControlStrokeColorDefault`. `tint`, `onTint`, `switchOn`, `destructive` and `onDestructive` have no Fluent twin and keep the palette literal. |

### Reading colors

| Export | What it returns |
| --- | --- |
| `theme` | One entry per token as an opaque platform value, for styles. The OS resolves it and updates it when the scheme changes, with no re-render. |
| `useColor(token)` | A plain color string that tracks the scheme and the accent, for props that cannot take a platform color object (symbol tints, `@expo/ui` components). On web it hands out the CSS variable. |
| `usePalette()` | The resolved palette of the current scheme as plain strings on every platform, with the live accent as `tint`. For canvases, native views and anything that cannot read a variable. |
| `useNavTheme()` | A React Navigation theme built from the palette and the accent. |
| `colors` | The raw light and dark palettes. |
| `getThemeCSS()` | The palette as CSS variables, for `+html.tsx`. |
| `getThemeBootScript()` | The script that applies a saved forced scheme before the bundle runs, for `+html.tsx`. |

### High contrast

On Windows with `expo-windows`, while the user has a high contrast theme on,
`useColor`, `usePalette` and `useNavTheme` answer the theme's own colors: text
and separators in its text color, surfaces in its window and control faces,
the accent as its highlight. They follow the user turning it on or off.
`useHighContrast()` reads the setting (`enabled`, the theme's `scheme` name
and its `colors`) for anything that draws outside the palette, and
`highContrastPalette(colors)` is the mapping. A selected surface takes a
control face rather than the highlight, so a selection shows through its
outline, as the themes mean it to. Everywhere else the setting is off.

### Constants

| Export | What |
| --- | --- |
| `spacing` | `half` to `six`, 2 to 64 points |
| `bound.contentMaxWidth` | 800 points; `Screen`, headers and forms cap content at it on wide screens |
| `inset` | The top bar and bottom tab heights `Screen` pads for, per platform |
| `fonts` | The system faces: `system-ui` on iOS, CSS variables on web, Segoe UI Variable on Windows |
| `fontWeights` | `normal` to `heavy` |
| `variants` | The type scale, per platform: the iOS scale on iOS and web, the Material scale on Android, the Fluent ramp on Windows |

## Icons

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

### Filled icons

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

### Windows glyphs

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

### The `Icon` component

The kit's `Icon` draws a token as a font glyph on web (a `<span>` holding the
ligature, `aria-hidden`) and on Windows (a `Text` in Segoe Fluent Icons,
hidden from accessibility). It exists for those two platforms only; on iOS and
Android the kit uses `SymbolView` directly.

## Components

Everything is exported from `expo-interface`. Each entry below says what the
component does, which props it takes, what each platform renders, and where
the platforms differ.

### Layout

#### Screen

The root of a route: background, safe areas, status bar, a shared maximum
content width, an optional native host and a slot for a floating action
button.

Props: `native` (mount an `@expo/ui` host around the screen), `header`
(the screen sits under a stack header and skips the top inset; inferred under
`TabStack`), `gutter` (horizontal padding), `fab` (a node placed at the bottom
trailing corner, above the safe area and the tab bar).

| Platform | Renders |
| --- | --- |
| iOS, Android | `SafeAreaView`, `StatusBar` styled for the scheme, the window background painted through `expo-system-ui`, and with `native` an accent-seeded `@expo/ui` `Host` |
| Web | The same, with the background as the palette's CSS variable so a static export is in the right scheme before any JavaScript runs; the fab slot is fixed to the viewport |
| Windows | A plain view. A desktop window has no safe areas, no status bar and no `@expo/ui` host; `native` only marks the tree as hosted so self-hosting components render bare |

Content is capped at 800 points and centered on every platform.

#### ScreenHeader

A header bar with a title, an optional back button and a trailing slot, for a
screen that draws its own header.

Props: `title`, `onBack`, `trailing`, `dragRegion` (Windows: the row drags
the window while the content is in the title bar).

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A 64-point row under the status bar (under the floating tab bar on web), a chevron or arrow back button, a single-line title |
| Windows | A 48-point row like a WinUI title row, a Segoe back glyph, the caption buttons' room left at the ends, and `titleNode` and `leading` slots |

#### NativeHost

See [Hosts](#hosts).

#### Surface

A box in the theme's colors: a bar under a canvas, a floating strip of tools,
a card, a drop target, a notice. The one kit component that is React Native
on every platform, so it can hold what is not native.

Props: `color` (`background`, `element`, `selected`, `none`), `border`
(`none`, `all`, `top`, `bottom`), `dashed`, `borderColor`, `radius` (a number
or `pill`), `raised` (a soft shadow), `padding`, `onPress`, `onLongPress`,
`disabled`, `label` (the accessible name of a pressable surface), `onLayout`,
`style`, `testID`.

Differences:

- A pressed surface dims on iOS, Android and web. On Windows it paints
  WinUI's state fills instead (the subtle fill under the pointer, the tertiary
  fill while pressed), reacts to hover, takes the focus ring, and presses on
  Enter and Space.
- On web a pressable surface is a real `<button>`.

#### Card

A pressable `Surface` with slots: a document in a list, a space on a
dashboard.

Props: `header`, `children` (the body), `footer`, `overlay` (controls floated
over the trailing edge, level with the footer), `badge` (the top trailing
corner), `onPress`, `onLongPress`, `label`, `padding` (12), `gap` (8),
`disabled`, `style`, `testID`.

The same file draws it on every platform. `overlay` and `badge` are siblings
of the card's press target, not children, so a button inside them takes its
own press. Put actions in `overlay`, not in the body.

#### Toolbar

A bar of tools along a canvas: an editor's status bar, the strip over a
drawing, the row under a preview.

Props: `commands` (the bar described as data: `label`, `icon`, `onPress`,
`secondary`, `disabled`, `role`, `separator`, `testID` per command), or
`leading` and `trailing` nodes; `field` (a `TextField variant="inline"` that
grows into the space the controls leave); `placement` (`top` or `bottom`;
the rule goes on the side facing the content); `density` (`regular` or
`compact`); `children` (a second row under the controls); `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn `Surface` bar. The controls sit in one native host as a single row, so a bar of buttons and menus costs one host rather than one per control. With `commands`, the kit draws them as text buttons and puts the `secondary` ones behind a `Menu` labelled "More". |
| Windows | With `commands` and no `field`, a WinUI `CommandBar` island: the control lays the commands out, moves the ones that do not fit into its own overflow menu, and draws labels beside the icons (`compact` drops them and leaves the naming to the overflow). Otherwise a drawn bar of islands. |

Differences:

- A command marked `secondary` is in the overflow on every platform. Only
  Windows moves further commands there as the bar narrows.
- A `field` sends every platform to the drawn path: a text field is a React
  Native input and cannot live inside a `CommandBar`.
- `leading` and `trailing` are ignored when `commands` are given.

#### KeyboardBar

A bottom bar that sticks to the keyboard. It rides up by a transform, never a
resize, and reports the keyboard's height through `onKeyboard` so the content
above can pad or scroll by that much.

| Platform | How |
| --- | --- |
| iOS, Android | `react-native-keyboard-controller`, an optional peer the kit loads only natively. `AccentProvider` mounts its provider when the library is installed. Without it the bar is a plain view. |
| Web | A plain view. The browser keeps the page above the keyboard itself, and the library never reaches the web bundle. |
| Windows | React Native's keyboard events, which `expo-windows` raises from the window's touch keyboard with the rectangle it covers. The bar measures its own bottom edge, so the two meet whatever the window's height has become. Without the runtime nothing fires and the bar stays put. |

```sh
npx expo install react-native-keyboard-controller
```

#### FieldGroup

A scrollable settings form: titled sections of rows, each with an optional
note under it. `FieldGroup`, `FieldGroup.Section`, `FieldGroup.SectionHeader`
and `FieldGroup.SectionFooter`.

Section props: `title`, `titleUppercase`, `footer` (a note under the rows),
`footerColor` (`secondaryLabel` or `destructive`, for an error), plus the
`@expo/ui` base props.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Form` sections through `@expo/ui` |
| Android | The Material 3 grouped list drawn in Compose: a scrolling column of sections with the per-row corner radii of a grouped list. Not a lazy list, which would re-add hosted React Native rows to the view tree as it scrolls. |
| Web | `@expo/ui`'s universal `FieldGroup`, recolored to the kit's tokens |
| Windows | The Settings app's layout, drawn: a body-strong heading over a card of rows divided by hairlines, with the note under it |

Differences:

- `titleUppercase` is ignored on iOS, where the `Form` decides the header
  case.
- A kit `ListItem` inside a section is rendered flush, since the section
  already insets its rows. A row that asks for `inset` explicitly keeps it.

A `Sheet` full of one is how the kit does a form: the question is the
section's title and the note under it is the footer.

```tsx
<Sheet isPresented={open} onDismiss={close}>
  <FieldGroup>
    <FieldGroup.Section title="Rename document" footer="The name is shown to everyone with the link.">
      <TextField value={name} onChangeText={setName} autoFocus returnKeyType="done" onSubmit={save}/>
      <Button label="Save" onPress={save}/>
    </FieldGroup.Section>
  </FieldGroup>
</Sheet>
```

#### ListItem

A settings-style row with leading and trailing slots, supporting text, a
trailing action and the row's own actions.

Props: `children` (the headline), `leading`, `trailing`, `supporting`,
`action` (`label`, `onPress`, `disabled`, `role`, `variant` `text` or
`filled`), `swipeActions` (`label`, `onPress`, `icon`, `role`, `disabled`
per action), `inset` (default true), `onPress`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | `@expo/ui`'s SwiftUI list row, with `swipeActions` as real swipe actions on the trailing edge. A full swipe runs the destructive one. |
| Android | The Material 3 `ListItem`, or a plain row when `inset` is off, since the control's padding cannot be removed |
| Web | A drawn row in the DOM. The row is a `<button>` when pressable, and an `action` is a sibling button beside it, since buttons cannot nest. |
| Windows | A drawn row with a WinUI settings card's metrics, WinUI's state fills under the pointer |

Differences:

- Only iOS has a swipe. On Android, web and Windows the same actions are the
  row's context menu, opened by a long press or a right click, and the row's
  press goes through that menu's trigger so one gesture has one owner. Do not
  wrap the row in a `ContextMenu` as well.
- `inset` has nothing to turn off on iOS, where the `Form` supplies every
  inset.

#### Collapsible

A tappable header that shows or hides its content. Controlled with
`expanded` and `onExpandedChange`, or uncontrolled with `defaultExpanded`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `DisclosureGroup` |
| Android | `@expo/ui`'s Material 3 expandable list item |
| Web | A real `<details>` and `<summary>` |
| Windows | A drawn header row with a Segoe chevron. WinUI's `Expander` is the same row, but its content would have to be XAML, and a collapsible holds React Native content. |

`children` must be `@expo/ui` content on iOS and Android.

#### Divider

A hairline separator. Props: `vertical`, `color`, `inset`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Divider`. The surrounding stack decides the orientation; `vertical` only picks the inset's axis. |
| Android | Material 3 `HorizontalDivider` or `VerticalDivider` |
| Web | A real `<hr>` |
| Windows | A hairline view in the separator color, the stroke WinUI's dividers use |

#### EmptyState

What a screen shows when it has nothing to show: no drops yet, no results, no
connection. Props: `title`, `description`, `icon`, `action` (usually a
`Button`, drawn below the description), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS 17 and later | The system's `ContentUnavailableView`, with the `action` under it as React Native |
| Older iOS, Android, Web | A drawn column with the icon through `SymbolView` |
| Windows | The same column with a Segoe glyph |

The drawn layout is one accessibility element that reads the title and the
description together.

### Navigation

#### Stack

`Stack` is Expo Router's native stack on iOS, Android and web. On Windows,
where `react-native-screens` draws nothing, it is a stack of the kit's own on
Expo Router's stack router, so `router.push`, `Link` and `Stack.Screen`
options work the same. An app that uses the kit's `Stack` in its layouts has a
Windows build with no other change.

On Windows the stack draws its header (`title`, `headerTitle` as text or a
node, `headerLeft`, `headerRight`, `headerBackVisible`, `headerShown`). A
pushed screen arrives with WinUI's entrance, a short rise and fade rather than
a slide, and `animation: 'fade' | 'none'` changes it. A screen with
`presentation: 'modal'` (or `formSheet`, `containedModal`, `fullScreenModal`)
is a card over smoke above the screen below, the way a WinUI dialog is
arranged, and a `transparentModal` lies over the window as it is. Escape, the
smoke and the back button dismiss a modal; Alt+Left, the keyboard's back key
and the mouse's back button pop the stack. With `expo-windows` the window's
title follows the focused screen ("Settings – My App").

#### Tabs

The app's section tabs for Expo Router.

Props: `routes` (`name`, `href`, `label`, `icon`, `badge`,
`windowsPlacement`), `hidden`, and per platform: `webLogo` (`icon-only`,
`text-only`, `icon-and-text` or a node), `webIcon`, `webActions`,
`webActionsPlacement`, `webFoldHeader`, `windowsPane` (`top`, `left`,
`compact`, `auto`).

| Platform | Renders |
| --- | --- |
| iOS, Android | Expo Router's native tabs: the platform's own tab bar at the bottom, with `badge` as the bar's badge |
| Web | A floating bar along the top with the app's logo, the tabs and action slots. A route's `badge` is a pill beside the label. |
| Windows | A WinUI `NavigationView`: the top bar, or with `windowsPane` the navigation pane down the left side, expanded (`left`), at its glyph-only width (`compact`), or `auto` by the window's width at WinUI's own breakpoints (the expanded pane from 1008 points, the compact one from 641, the top bar below that). The pane's toggle button switches between the two. A count `badge` is an `InfoBadge`; other text is its dot. `windowsPlacement` puts a route at the pane's foot (`footer`) or makes it WinUI's own settings item (`settings`). |

On web a screen under `Tabs` has one bar, not two: `ConstrainedStackHeader`
hands its header to the bar and draws nothing itself. A pushed screen hands
over all of it (the back button in the mark's place, the title where the
app's name goes, `headerRight` where `webActions` go). A tab's own screen
hands over `headerRight` alone and keeps its title, since the tab beside it in
the bar already says it. The bar keeps the height of its tabs, and a header
control folded into it drops to their size. `hidden` hides the tabs rather
than the bar while a pushed screen's header is folded in;
`webFoldHeader={false}` keeps the two rows.

On web the bar is a `navigation` landmark of links, not a `tablist`, since the
tabs move between routes rather than panels; the active one carries
`aria-current="page"`, and a pushed screen's title is the page's `h1`.

The Windows pane width is measured rather than read from the window, since
react-native-windows reports no dimension change when the window is resized.

#### TabStack

The stack inside a tab, with the platform's header over the tab's screens.
Props: `title`, `headerRight`. On web its header is `ConstrainedStackHeader`;
on Windows it is the kit's `Stack`. A `HeaderMenu` in `headerRight` survives
Android's header re-parenting; a plain `Menu` in a host does not.

#### ConstrainedStackHeader

The web stack header: a row that matches the content's maximum width, or,
under a `Tabs` bar with `webFoldHeader`, nothing at all, since the bar carries
the header. On the other platforms it renders nothing and the native stack's
header is used.

#### TabView

Document tabs: a strip of things the user opened and can close, with the
selected one's content under it. These are not the tabs `Tabs` draws.

Props: `tabs` (`id`, `title`, `icon`, `pinned`), `selected`, `onSelect`,
`onClose` (leaving it out takes the crosses away), `onAdd` (leaving it out
takes the add button away), `children` (the selected tab's content), `label`
("Tabs"), `layout` (`auto`, `strip`, `switcher`), `style`, `testID`.
`nextSelection(tabs, closing, selected)` is exported for a caller that closes
the open tab: it moves to the next tab, or the previous one when the last was
closed.

| Platform | Strip (640 points and wider) | Switcher (narrower) |
| --- | --- | --- |
| iOS, Android | A drawn strip with a real close button beside each tab | A count button that opens a grid of cards |
| Web | A drawn strip in the APG tab pattern | The same grid |
| Windows | A WinUI `TabView`, the strip alone: the items carry no content, and the page is drawn underneath by React Native | The same grid, with Segoe glyphs |

Differences:

- Below 640 points no platform draws a strip. This is what Safari and Chrome
  do on a phone, 640 is both WinUI's compact breakpoint and Android's medium
  window class, and it is measured rather than read from the window, since a
  pane beside the tabs changes the room they have.
- On web the close cross is a pointer affordance, not a control: ARIA makes
  everything inside a `tab` presentational and allows no button among a
  `tablist`'s children. The keyboard closes a tab with Delete, which each
  closable tab announces through `aria-keyshortcuts`. Arrow keys move and
  select at once. iOS and Android keep a real button that VoiceOver and
  TalkBack reach; Windows has the control's own cross.
- Reordering is off on Windows. A drag would move the tab in the control
  while the kit's array stayed as it was, so the control is told not to offer
  it.
- The cards are a title, an icon and a cross, not live previews.

#### Pager

A row of full-width pages that snaps to one at a time, with an indicator.
Props: `page`, `onPageChange`, `children` (one per page), `indicator`
(default true; never shown for one page), `label`, `style`, `testID`.

| Platform | Scroller | Indicator |
| --- | --- | --- |
| iOS | `UIScrollView` paging | Drawn dots |
| Android | A snapping scroll view | Drawn dots |
| Web | `scroll-snap-type: x mandatory` | A drawn tab list with arrow keys |
| Windows | The composition scroller's snap points | A WinUI `PipsPager`, with the chevrons Fluent shows under the pointer |

The scroller is React Native's own paging on every platform. The native
indicators are not reachable (`UIPageControl` is not wrapped, Material's is
not exposed), and a `PipsPager` fits because it has no children. A swipe
reports the page it lands on and nothing more; if `page` does not follow, the
view stays where the finger left it. On web the off-screen pages are `inert`,
so nothing hidden can take focus.

#### HeaderMenu, HeaderAction, HeaderActions

Controls for a stack header's trailing slot (`TabStack`'s `headerRight`).
`HeaderMenu` is a `Menu` at the platform's header size; `HeaderAction` is the
same trigger with a press instead of a menu; `HeaderActions` is the row for a
slot that takes one node, and the one host for all of them.

```tsx
headerRight={() => (
  <HeaderActions>
    <HeaderAction label="Share" icon={icon.share} hideLabel tone="label" onPress={share}/>
    <HeaderMenu label="Export" icon={icon.export} hideLabel tone="label" items={exports}/>
  </HeaderActions>
)}
```

A plain `Button` is the wrong thing in a header: the app would have to size
it, it would not shrink when the web tab bar carries the header, and natively
it is a SwiftUI or Compose view that a React Native header cannot hold
without a host. The row spaces its children the way each platform spaces its
own header actions: none on Android, where Material's icon buttons carry
their own 48dp container. On Android the host is rebuilt on every focus
change, since the native stack re-parents the header's views on a tab switch
and a Compose view refuses a second parent, so these need a navigator above
them there. On Windows the row is a plain view of islands.

#### ExternalLink

A link to a URL outside the app.

| Platform | Opens in |
| --- | --- |
| iOS, Android | The in-app browser (`expo-web-browser`) |
| Web | A new tab |
| Windows | The default browser, through `Linking`. There is no in-app browser, and `expo-web-browser` has no Windows module. |

#### ShareLink

A button that hands something to the platform's share sheet. Props: `label`,
`url`, `message`, `title` (what the sheet calls it; defaults to `label`),
`icon`, `onShare` (called once the sheet has been asked for, with whether the
platform could open one), and the `Button` props `variant`, `size`, `shape`,
`tone`, `color`, `disabled`, `hideLabel`.

| Platform | How |
| --- | --- |
| iOS | SwiftUI's own `ShareLink`, with the kit's `Button` as its label. The control presents the sheet itself. |
| Android | React Native's `Share`, an `ACTION_SEND` intent |
| Web | React Native's `Share` through `navigator.share` |
| Windows | The kit's own native module over `DataTransferManager`, since React Native's `Share` dispatches on iOS and Android only. No package identity is needed. |

A share with neither a message nor a link is disabled rather than opening an
empty sheet. `onShare` reports whether the sheet opened, not what the person
did in it.

### Controls

#### Button

Props: `label` (required, the accessible name even with `hideLabel`),
`onPress`, `variant` (`filled`, `outlined`, `text`), `role` (`default`,
`destructive`), `color`, `tone` (`accent`, `label`; filled and outlined
buttons ignore it), `size` (`inline`, `small`, `medium`, `large`), `shape`
(`rounded`, `pill`, `circle`; each platform's default when omitted),
`iconSize`, `prefixIcon`, `suffixIcon`, `hideLabel`, `disabled`, `fillWidth`,
`testID`. Web only: `popoverTarget` and `popoverTargetAction`, so the browser
manages a popover's open state, `aria-expanded` and light dismiss without
JavaScript.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Button` in the bordered-prominent, bordered or plain style |
| Android | Material 3 `Button`, `OutlinedButton` or `TextButton`, or the icon buttons when icon-only. `size: 'inline'` is a clickable row, since Material's buttons keep a minimum height no modifier can shrink. |
| Web | A real `<button>` |
| Windows | WinUI `Button`: the accent style for `filled`, the standard one for `outlined`, transparent for `text`, with Segoe glyphs |

Differences:

- `hideLabel` needs an icon the platform can draw: a drawable on Android, a
  Segoe glyph on Windows. Without one the label still reads.
- `suffixIcon` needs a drawable on Android and is dropped when the button is
  icon-only.

#### Chip

A small rounded thing you press: a filter across the top of a list, a tag on
a row, a suggestion under a field. Props: `label`, `onPress` (called with
what the state would become), `selected`, `icon`, `disabled`, `testID`.

Giving `selected` at all makes the chip a filter that can be off; leaving it
out makes it an action. Every platform splits on that, into the control that
carries the state to a screen reader and the one that does not:

| Platform | Filter | Action |
| --- | --- | --- |
| iOS | SwiftUI `Toggle` in the button style | A capsule `Button` |
| Android | `FilterChip` | `AssistChip` with an icon, `SuggestionChip` without |
| Web | `<button aria-pressed>` | `<button>` |
| Windows | WinUI `ToggleButton` with a pill radius | The kit's outlined pill `Button` |

Material's input chip, the one with a remove cross, is not offered: no other
platform has a control for it.

#### IconToggle

A round icon button with two states, the outline when off and the filled
glyph when on. Props: `label`, `icon`, `activeIcon` (defaults to `icon`),
`value`, `onValueChange`, `color`, `offColor`, `size` (24), `disabled`,
`testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Button` with the selected trait while on |
| Android | Material 3 `IconToggleButton` |
| Web | `<button aria-pressed>` |
| Windows | WinUI `ToggleButton` holding a `FontIcon`, with the two colors in place of the control's checked fill |

On Windows a token with no Segoe glyph renders nothing.

#### Switch

An on/off toggle with a leading label. Props: `label`, `value`,
`onValueChange`, `disabled`, `accentColor` (the on track), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Toggle`, whose label is the row |
| Android | Material 3 `Switch` at the trailing edge of a Compose row, with a white thumb as on iOS |
| Web | react-native-web's switch in a drawn row |
| Windows | WinUI `ToggleSwitch` at the trailing edge of a drawn row |

#### Checkbox

A checked or unchecked box with a leading label. Props: `label`, `value`,
`onValueChange`, `disabled`, `accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | A tinted `checkmark.square` glyph in a plain `Button`. SwiftUI on iOS has no checkbox control; the glyph is the platform idiom. |
| Android | Material 3 `Checkbox`, with the whole row toggleable |
| Web | A real `<input type="checkbox">` inside a `<label>`, so the text toggles it |
| Windows | WinUI `CheckBox` at the trailing edge of a drawn row |

#### TextField

A single or multi-line text input. Props: `placeholder` (also the row's
label), `value`, `onChangeText`, `onSubmit`, `onKeyPress`, `disabled`,
`secureTextEntry`, `keyboardType` (`default`, `email`, `number`, `phone`,
`decimal`, `url`), `autoCapitalize`, `autoCorrect`, `multiline`, `autoFocus`,
`returnKeyType` (`done`, `go`, `next`, `search`, `send`), `submitBehavior`
(`blurAndSubmit`, `submit`), `variant` (`row`, `inline`), `maxLength`,
`accentColor`, `style`, `testID`.

The `row` variant is the platform's field with a form row's borderless look.
The `inline` variant is a React Native input for a field inside a React
Native layout on every platform; it focuses on mount with `autoFocus` and
makes sure the keyboard came on Android.

| Platform | `row` renders |
| --- | --- |
| iOS | SwiftUI `TextField` or `SecureField` |
| Android | Material 3 `TextField` with the filled look stripped |
| Web | react-native-web's `TextInput`, a real `<input>` |
| Windows | WinUI `TextBox` or `PasswordBox`, borderless |

Differences:

- `autoCapitalize` has no Windows equivalent.
- `submitBehavior` is honoured on web and in `inline`. Compose keeps the field
  focused after a submit, and on Windows Enter submits and keeps the focus.
- `onKeyPress` reaches `inline` and the web and Windows rows.
- `onSubmit` on web fires for Enter but not Shift+Enter.
- `style` applies to the text on web and in `inline`.

#### SearchField

A field for searching: the query box, a way to clear it, and optionally a
list of completions under it. Props: `value`, `onChangeText`, `onSubmit`
(Enter, the platform's search key, or a completion taken), `placeholder`,
`suggestions`, `disabled`, `clearable` (default true), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android | A drawn row: a magnifier, an inline `TextField`, a clear button, and a raised list of suggestions filtered to what the text contains. Compose's `SearchBar` takes a query it does not let the app set, so a controlled field cannot be built on it. |
| Web | `<input type="search">` with a `<datalist>`. The browser owns the combobox keyboard pattern and its own clear button. |
| Windows | WinUI `AutoSuggestBox`, which draws the box, the query glyph, the clear button and the list |

`clearable` is honoured on iOS and Android only; web and Windows have the
control's own clear button. A `<datalist>` entry is text only, so a
suggestion carries no icon on web.

#### Picker

A dropdown that selects one option, with `Picker.Item` children (`label`,
`value`). Props: `label`, `selectedValue`, `onValueChange`, `disabled`,
`accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Picker` in the menu style |
| Android | A Compose row that mirrors the iOS form look, opening a Material `DropdownMenu`. The stock dropdown spans the row with no label. |
| Web | A drawn pill with a transparent native `<select>` over it, so the platform's own options popup opens |
| Windows | WinUI `ComboBox` at the trailing edge of a drawn row |

#### SegmentedControl

A row of segments that selects one option, with `SegmentedControl.Item`
children. Props: `label`, `selectedValue`, `onValueChange`, `disabled`,
`accentColor` (the selected segment's fill), `size` (`small`, `medium`,
`large`), `shape` (`rounded`, `pill`), `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Picker` in the segmented style |
| Android | Drawn in Compose from a shared geometry table. Material's own segmented button row hardcodes its shape and height and stamps a checkmark into the selected segment. |
| Web | A `radiogroup` of `radio` buttons with roving focus: one tab stop, and the arrows move and select |
| Windows | WinUI `SelectorBar`, a row with an accent underline on the selected item |

On Windows `size` and `shape` are not applied, since the control has one of
each, and `accentColor` colors the underline. On iOS `shape` matters for
`pill` only, since `rounded` is the system's own corner.

#### Slider

A thumb dragged along a continuous or stepped range. Props: `label`, `value`,
`onValueChange` (continuous while dragging), `onSlidingComplete` (once on
release), `min` (0), `max` (1), `step` (omit for continuous), `disabled`,
`accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Slider` |
| Android | Material 3 `Slider`. The kit converts the increment into Compose's interval count and snaps the value itself. |
| Web | A real `<input type="range">` |
| Windows | WinUI `Slider`. A continuous slider moves by a thousandth of the range. |

#### Stepper

A number adjusted with increment and decrement buttons. Props: `label`,
`value`, `onValueChange`, `step` (1), `min`, `max`, `formatValue`,
`disabled`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Stepper` with its label hidden, beside the kit's label and value |
| Android | Two Material 3 outlined icon buttons. Compose has no stepper. |
| Web | Two buttons in an iOS-style pill |
| Windows | WinUI `NumberBox` with inline spin buttons, which also takes a typed value |

`formatValue` is applied on iOS, Android and web. It is not applied on
Windows, where the box shows the number it edits.

#### DateTimePicker

Picks a date, a time or both. Props: `label`, `value`, `onChange`, `mode`
(`date`, `time`, `datetime`), `minimumDate`, `maximumDate`, `disabled`,
`accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `DatePicker` in the compact style, one control for both parts |
| Android | A Compose row that opens the Material `DatePickerDialog`, then the `TimePickerDialog` for `datetime`. Android has no inline date and time control. |
| Web | A drawn pill with a native `<input type="date">`, `time` or `datetime-local` over it |
| Windows | WinUI `CalendarDatePicker` and `TimePicker`, one or both by `mode`. Each edits its own part of the value and keeps the other's. |

The bounds are honoured everywhere except by the Windows `TimePicker`, which
takes none.

#### ColorPicker

A label with a color well that opens a color picker, optionally with preset
swatches. Props: `label`, `value` (`#RRGGBB` or `#RRGGBBAA`),
`onValueChange`, `supportsOpacity` (default true), `swatches`, `disabled`,
`style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `ColorPicker`, the system picker |
| Android | A Compose row that opens the iOS system picker redrawn in React Native (grid, spectrum, sliders, opacity, saved colors) in a `ModalBottomSheet` |
| Web | The same redrawn picker in a `Sheet` |
| Windows | A color well opening a `Flyout` with the WinUI `ColorPicker`: spectrum, sliders, hex field and, with `supportsOpacity`, the alpha channel |

Swatches are round on every platform, the selected one ringed, wrapping onto
further lines when they overflow. Tapping a swatch keeps the current opacity.

### Indicators

#### Progress

A linear bar or a circular ring, determinate or indeterminate. Props: `value`
(0 to 1; omit for indeterminate), `variant` (`linear`, `circular`), `size`
(24, circular only), `color`, `trackColor`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `ProgressView`. `trackColor` has no SwiftUI equivalent, and the system spinner keeps its own size. |
| Android | Material 3 `LinearProgressIndicator` or `CircularProgressIndicator` |
| Web | A real `<meter>`, or an SVG ring. The web platform has no indeterminate meter, so a linear bar without a value renders empty. |
| Windows | WinUI `ProgressBar` or `ProgressRing` |

#### Spinner

The platform's activity indicator: an indeterminate circular `Progress`, in a
host of its own when it sits in a React Native layout and bare inside one.
Props: `size`, `color`, `testID`.

#### Gauge

A value within a range in the SwiftUI gauge styles. Props: `value`, `min`,
`max`, `variant` (`automatic`, `linear`, `linearCapacity`, `circular`,
`circularCapacity`), `label`, `currentValueLabel`, `minimumValueLabel`,
`maximumValueLabel`, `accentColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Gauge` |
| Android | Redrawn from Compose primitives to the geometry measured from iOS: the rings are `CircularProgressIndicator`s, the bars clipped boxes |
| Web | DOM and SVG to the same geometry |
| Windows | Bars drawn in React Native; the rings are the WinUI `ProgressRing`. The open `circular` style is the same ring, its marker being the ring's end. |

#### Badge

A count or a dot beside the thing it is about. Props: `count` (`0` draws
nothing), `max` (99; counts above draw as `99+`), `showZero`, `dot`, `label`
(the accessible name; defaults to the count and what it is about), `color`,
`textColor`, `style`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | Drawn as the UIKit capsule. SwiftUI's `badge` modifier only paints inside a `List`, a `TabView` or a toolbar and is silently ignored anywhere else. |
| Android | Material 3 `Badge` |
| Web | A `<span role="status">` |
| Windows | WinUI `InfoBadge`. It holds a number and nothing else, so an overflowing count reads as the cap (`99`) where the others draw `99+`; the accessible name carries the true wording. |

TalkBack reads the number alone on Android: `@expo/ui`'s Compose layer
exposes no modifier that sets a content description. The other three announce
the label.

Placing a badge over a control is the caller's job. On Windows, put it beside
a pressable control or inside it: a XAML island takes pointer input for
itself whatever React Native's `pointerEvents` says, so a badge laid over a
button swallows the button's presses.

#### Avatar

A person as a colored circle with their initials, hashed from the name so
the same person keeps the same color. Props: `name`, `initials`, `color`,
`size` (28), `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn circle |
| Windows | WinUI `PersonPicture`, filled with the same hashed color |

#### Typography

Text in the platform's type scale. `Typography` with a `variant`, and the
variants as components: `LargeTitle`, `Title`, `Title2`, `Title3`,
`Headline`, `Body`, `Callout`, `Subheadline`, `Footnote`, `Caption`,
`Label`. Props: `variant`, `weight`, `align`, `color` (a token),
`numberOfLines`, `level` (the heading level, overriding the one the variant
implies; `false` for a large line that is not a heading), `style`, `testID`.

The title variants are headings: `largeTitle` is level 1, `title` 2, `title2`
3, `title3` 4, `headline` 5. On web they carry `role="heading"` with
`aria-level`, on the other three `accessibilityRole="header"`, so a screen
reader can navigate by heading.

| Platform | Scale |
| --- | --- |
| iOS, Web | The iOS type scale, in `system-ui` on iOS and the CSS font variables on web |
| Android | The Material scale |
| Windows | The Fluent ramp in Segoe UI Variable: `largeTitle` is Fluent's Title Large, `title` its Title, `body` its Body, `caption` its Caption |

### Overlays

#### Menu

A dropdown menu of actions opened from a button. Props: `label`, `icon`,
`items`, `trigger` (`button`, or `link` for a text link in a bar),
`onOpenChange`, `testID`, and the `Button` props `variant`, `size`, `shape`,
`color`, `tone`, `iconSize`, `hideLabel`, `disabled`.

A `MenuItem` has `label`, `icon`, `swatch` (a color dot in place of the
icon), `active` (a check mark), `role` (`default`, `destructive`),
`disabled`, `keywords` (never drawn; read by `PopupMenu`'s filter),
`separator` (a rule above the item), `shortcut` (`Ctrl+S`, `F2`) and
`onPress`. `Menu`, `ContextMenu`, `PopupMenu` and `Fab` share it.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Menu`, with a checked `Toggle` for an active item |
| Android | Material 3 `DropdownMenu` |
| Web | A `role="menu"` popover placed by CSS anchor positioning below the trigger, flipping when there is no room, with one tab stop, arrow keys, Home, End and typeahead |
| Windows | WinUI `MenuFlyout` below the trigger |

Differences:

- `onOpenChange` is reported on Android, web and Windows. SwiftUI's `Menu`
  has no presentation binding, so iOS never reports it.
- `swatch` is drawn on Android, web and Windows. iOS menus render images
  monochrome, so the dot is not shown there.
- `shortcut` is drawn beside the label and bound wherever the focus is while
  the menu is mounted on Windows, as WinUI draws an accelerator. The other
  platforms ignore it.
- `trigger: 'link'` is a text link on web and the text variant on Windows.

#### ContextMenu

A menu of actions opened by long-pressing or right-clicking its content, or
at a point the content reports. Props: `items`, `children` (must be `@expo/ui`
content on iOS and Android), `onPress` (the content's own press), `trigger`
(`longPress`, the default, or `tap`), `disabled`, `at` (a point relative to
the content's top left, or `null`), `onDismiss`, `onOpenChange`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `contextMenu` on a long press, or a SwiftUI `Menu` with the content as its label for `tap` |
| Android | Material 3 `DropdownMenu` from `combinedClickable`'s long click, or its click for `tap` |
| Web | The same menu popover as `Menu`, opened at the pointer by `contextmenu` or a 500 ms touch press, or by a click for `tap` |
| Windows | WinUI `MenuFlyout` at the pointer, from the right mouse button, a long press, the Menu key or Shift+F10, or a press for `tap` |

Differences:

- `at` opens the menu at a point on Android, web and Windows. SwiftUI has no
  menu at a point, so iOS ignores it and does not report `onDismiss`.
- A right click and the Menu key open the menu on web and Windows whichever
  `trigger` says; they are what the platform and its screen readers reach for.
- `onOpenChange` is not reported on iOS.
- There is no `doubleTap` trigger: `@expo/ui` exposes no double click from
  Compose, and SwiftUI has no way to open a context menu programmatically.

#### PopupMenu

The platform's menu opened at a point over content the kit did not draw: a
canvas, a web view, an editor. It wraps nothing. Props: `items`, `at` (a
point, or `null` to close), `filter` (matches the label or `keywords`, for a
menu typed into), `onDismiss`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS | A SwiftUI `Popover` with the rows drawn by hand, since SwiftUI opens a `Menu` only from its own button |
| Android | Material 3 `DropdownMenu` from a one-point host |
| Web | The same menu popover, anchored at the point |
| Windows | WinUI `MenuFlyout` at the point |

On web the matched part of a label is marked with the CSS Custom Highlight
API, which adds nothing to the DOM and leaves the accessible name as it was.
The other platforms take plain label strings and show the match unmarked.

`caretPoint(field, within)` measures where the caret is in a text field, so
a `PopupMenu` can open under it for a slash command. It is web only: React
Native's `TextInput` reports selection as offsets and no rectangle, and a
caret point on the other platforms would take a native module each. There it
answers `null`, and a caller anchors the menu under the field instead.

#### Popover

A card pointing at a rectangle on a canvas: a spelling suggestion, a note on
a block, a warning about a link. Props: `at` (`{x, y, width, height}` or
`null`), `title`, `message`, `actions` (`label`, `onPress`, `role`),
`onDismiss`, `preferredEdge` (`auto`, `top`, `bottom`), `width` (280),
`children`, `testID`.

| Platform | Renders |
| --- | --- |
| iOS, Android, Web | A drawn `Surface` card placed below the rectangle and flipped above when there is no room, with native buttons for the actions |
| Windows | A WinUI `TeachingTip` with a tail that points at its target. A popover with `children` is drawn as on the other platforms, since its content is React Native's. |

`preferredEdge` offers the two vertical edges only, since the drawn card
cannot reach a side, and it is a preference: with no room on the edge asked
for, the card goes to the other.

#### Tooltip

A short hint attached to a piece of content. Props: `text`, `children` (must
be `@expo/ui` content on Android, and non-interactive everywhere, since the
web trigger is a button), `testID`.

| Platform | Renders |
| --- | --- |
| iOS | Nothing visible. iOS has no tooltip idiom (`help()` is macOS and visionOS only), so the text becomes an accessibility hint on the content. |
| Android | Material 3 `PlainTooltip` on a long press |
| Web | A `role="tooltip"` popover on hover and focus through the Interest Invoker API (`interestfor`), with the `title` attribute where the browser lacks it |
| Windows | react-native-windows' own tooltip on hover and keyboard focus |

On Windows the tooltip is a pointer and focus affordance only. The wrapper is
not what takes the focus, and react-native-windows composes no help text from
an ancestor, so Narrator does not read it. An app that needs the text
announced sets `accessibilityHint` on the control itself.

#### Alert

A modal dialog, or an action sheet, with a title, a message and actions.
Props: `title`, `message`, `visible`, `onDismiss`, `actions` (`label`,
`role` `default`, `cancel` or `destructive`, `onPress`; defaults to one OK),
`sheet`, `children` (an optional trigger rendered in place), `testID`. It
mounts its own host where there is none, so it can be rendered anywhere.

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI `Alert`, or `ConfirmationDialog` with `sheet` |
| Android | Material 3 `AlertDialog`, with the actions in a column for `sheet` |
| Web | A real `<dialog>` opened with `showModal()`: the top layer, a backdrop, a focus trap and Escape. `sheet` anchors it to the bottom. |
| Windows | A dialog in `ContentDialog`'s arrangement, smoke over the whole window and the card with the title, message and actions, drawn in a windowed popup, since a `ContentDialog` can only cover its own island. Up to three actions take the dialog's own buttons; more are stacked in the body. |

`sheet` has no Windows form; a dialog is drawn either way.

#### Sheet

A bottom sheet that inherits the accent, over `@expo/ui`'s `BottomSheet`
props plus `material` (`none`, `thin`, `regular`, `thick`).

| Platform | Renders |
| --- | --- |
| iOS | SwiftUI's sheet, with a real material through `presentationBackground` |
| Android | Compose's `ModalBottomSheet`. It takes a container color and nothing else, so the sheet is opaque. |
| Web | `@expo/ui`'s drawer with `backdrop-filter` for the material |
| Windows | A layer drawn in React Native: WinUI's smoke and a centered card, the content scrolling inside, covering the whole window under the kit's `Stack` and the nearest ancestor elsewhere. A sheet's content is React Native's, which no XAML flyout or dialog can hold, and React Native's `Modal` cannot hold a XAML island on react-native-windows 0.84. No material. |

The sheet's content counts as hosted: controls inside it render bare.

#### Toast

A brief message over the screen. Props: `message`, `visible`, `action`
(`label`, `onPress`), `onDismiss`, `duration` (4000 ms), `testID`.

A duration of zero or less keeps the toast up until its action is taken or it
is dismissed, which is what Material calls an indefinite snackbar.

| Platform | Renders |
| --- | --- |
| iOS, Web | A drawn capsule, the one Apple's apps draw, timed by the kit |
| Android | Material 3 `Snackbar`, which owns its timing, animation and queue and rounds the duration to the platform's short, long or indefinite |
| Windows | WinUI `InfoBar` over the bottom of the screen, with a close button, timed by the kit |

The drawn toast is a polite live region.

## Web

The web files render the real DOM, and floating UI uses the platform's own
primitives rather than a portal and a z-index:

| Behaviour | Where it comes from |
| --- | --- |
| Top layer, light dismiss, `aria-expanded` | `popover="auto"` in `Menu`, `ContextMenu`, `PopupMenu`, `Fab` |
| Placement and flipping | CSS anchor positioning with `position-try-fallbacks`, feature-detected with a measured fallback |
| Focus trap, Escape, inert background | `<dialog>` with `showModal()` in `Alert` |
| Hover and focus hint with the system delay | `interestfor` in `Tooltip`, feature-detected |
| Full keyboard and the native picker on mobile | `<select>` in `Picker`, `<input type="date">` in `DateTimePicker` |
| Arrow, Home, End, PageUp | `<input type="range">` in `Slider` |
| The combobox pattern | `<input type="search">` with `<datalist>` in `SearchField` |
| Press, Enter, Space, disabled | Real `<button>` elements throughout |

Where a composite ARIA role promises a keyboard pattern the browser does not
supply, `useRovingFocus` in `src/a11y` supplies it: one tab stop, arrow keys
along an axis, Home and End, typeahead, wrap or clamp, disabled items
skipped. It backs `Menu`, `ContextMenu` and `PopupMenu` (vertical, with
typeahead), `SegmentedControl` (horizontal, selection following focus) and
`TabView` (horizontal, automatic activation). Typeahead matches visible text
and skips `aria-hidden` icon ligatures.

Styles live in a `.css` file beside each component. The palette is CSS
custom properties from `getThemeCSS()`, the accent is `--color-tint` set by
`AccentProvider`, and a forced scheme is `data-theme` on the root.

The Material Symbols font is registered by the kit on import.

## Windows

### Islands

Each kit control with a WinUI counterpart is a Fabric native component from
`windows/ExpoInterface`, hosting the control in a XAML island, themed by
Fluent and branded from the accent seed. The island reports the size its
control wants to Yoga, so a button hugs its content unless a style stretches
it. Props reach the control in `UpdateProps`; events come back through the
codegen emitter. The specs in `src/windows/specs/` are the contract, and
`bun run codegen:windows` regenerates the headers after a spec change.

| Island | WinUI control | Used by |
| --- | --- | --- |
| `ExpoInterfaceButton` | `Button` | `Button`, `Menu`'s trigger, `HeaderAction`, `ShareLink`, `Chip` (action) |
| `ExpoInterfaceToggleSwitch` | `ToggleSwitch` | `Switch` |
| `ExpoInterfaceCheckBox` | `CheckBox` | `Checkbox` |
| `ExpoInterfaceToggleButton` | `ToggleButton` with a `FontIcon` | `IconToggle` |
| `ExpoInterfaceChip` | `ToggleButton` with a pill radius | `Chip` (filter) |
| `ExpoInterfaceProgress` | `ProgressBar`, `ProgressRing` | `Progress`, `Spinner`, `Gauge` rings |
| `ExpoInterfacePersonPicture` | `PersonPicture` | `Avatar` |
| `ExpoInterfaceInfoBadge` | `InfoBadge` | `Badge` |
| `ExpoInterfacePipsPager` | `PipsPager` | `Pager` |
| `ExpoInterfaceSlider` | `Slider` | `Slider` |
| `ExpoInterfaceNumberBox` | `NumberBox` | `Stepper` |
| `ExpoInterfaceComboBox` | `ComboBox` | `Picker` |
| `ExpoInterfaceSelectorBar` | `SelectorBar` | `SegmentedControl` |
| `ExpoInterfaceDatePicker`, `ExpoInterfaceTimePicker` | `CalendarDatePicker`, `TimePicker` | `DateTimePicker` |
| `ExpoInterfaceTextBox` | `TextBox`, `PasswordBox` | `TextField` |
| `ExpoInterfaceColorPicker` | `ColorPicker` in a `Flyout` | `ColorPicker` |
| `ExpoInterfaceAutoSuggestBox` | `AutoSuggestBox` | `SearchField` |
| `ExpoInterfaceMenuFlyout` | `MenuFlyout` | `Menu`, `ContextMenu`, `PopupMenu`, `Fab`, `HeaderMenu` |
| `ExpoInterfaceContentDialog` | `ContentDialog`'s arrangement in a windowed popup | `Alert` |
| `ExpoInterfaceTeachingTip` | `TeachingTip` | `Popover` |
| `ExpoInterfaceCommandBar` | `CommandBar` | `Toolbar` |
| `ExpoInterfaceInfoBar` | `InfoBar` | `Toast` |
| `ExpoInterfaceNavigationView` | `NavigationView` | `Tabs` |
| `ExpoInterfaceTabView` | `TabView` | `TabView` |

The library also holds one native module, `ExpoInterfaceShare`, over
`DataTransferManager` for `ShareLink`.

What has no WinUI control is drawn with Fluent metrics in Segoe UI Variable:
`Screen`, `ScreenHeader`, `Surface`, `Card`, `ListItem`, `FieldGroup`,
`Collapsible`, `Divider`, `EmptyState`, `Typography`, `Fab`, `KeyboardBar`,
`Sheet`, the stack's header and modals, the pager's scroller, the tab
switcher, the color picker's swatches and the gauge's bars. The drawn
pressables behave as WinUI's own controls do at a desk: the state fills under
the pointer and while pressed, the focus ring when tabbed to, Enter and Space
to press.

Two facts about islands shape the kit's Windows files:

- An island takes pointer input for itself whatever React Native's
  `pointerEvents` says. The kit's menu islands are therefore a one-pixel strip
  along the trigger's edge or a one-point anchor, never laid over the trigger.
- An island holds XAML. A control that wraps content (`Expander`,
  `SwipeControl`, `TabView` items, `Flyout` content) cannot hold the kit's
  React Native content, so those components draw the content beside or under
  the island instead.

Menus, dropdowns, the popover and the alert open as windowed popups, which is
why they can extend past their island.

### The window

With `expo-windows`, `useWindowChrome({extend: true})` in the root layout
extends the content into the title bar: no system title, the caption buttons
drawn for the scheme over the app's own top row, and the root `Stack`'s
header as the region that drags the window, leaving the caption buttons
their room. With that header hidden nothing drags the window. There is no
Mica or acrylic backdrop behind the content: a Win32 window on the Windows
App SDK's composition islands has no backdrop target in this release.

The kit's `Stack` names the window after the focused screen.

### Keyboard

A menu item's `shortcut` is drawn beside its label as WinUI draws an
accelerator and bound wherever the focus is while the menu is mounted.
`useKeyboardShortcut('Ctrl+K', handler)` binds one from any screen. The keys
reach the kit's `Stack` from the focused control, and of two bindings to one
shortcut the later mounted wins, so a screen's is in front of its layout's.
On the other platforms the hook binds nothing and the shortcut text is not
drawn.

`ContextMenu` opens on the Menu key and Shift+F10 as well as a right click.
Alt+Left, the keyboard's back key and the mouse's back button pop the stack;
Escape closes the topmost modal.

The touch keyboard reaches React Native's `Keyboard` through `expo-windows`,
and `KeyboardBar` rides up to meet it.

### Right to left and scaling

Right to left follows the window, as for every Win32 window under an RTL
language: react-native-windows mirrors its layout, and the kit sets the same
flow direction on every island's root, which XAML does not inherit. The
caption buttons then sit on the left, and the headers and the top tab bar
leave them their room on that side. `I18nManager.forceRTL` alone mirrors
nothing on this renderer, and text keeps starting at the left under RTL
unless given an `align`.

Scaling is in points throughout: at 125% the drawn parts and the islands grow
together, and the drag region, the title bar insets and the keyboard's
rectangle are converted by the window's scale. `useWindowDimensions` reports
the window's physical size at a scale of 1 and never updates on a resize; the
kit measures its own layouts with `onLayout`, and an app should too.

## Accessibility

Every control has an accessible name on every platform. Past the name, each
platform gets what it can carry:

| Platform | What the kit sets |
| --- | --- |
| iOS | Labels, hints, values and traits on the SwiftUI controls; the heading trait on titles; `Tooltip` as a hint |
| Android | The Compose controls' own semantics; `contentDescription` on icons; the heading role on titles. `@expo/ui`'s Compose layer exposes no modifier for a content description, so a `Badge` reads its number alone. |
| Web | Real elements with their native semantics, ARIA roles where the kit composes (`menu`, `radiogroup`, `tablist`, `dialog`, `tooltip`, `status`, `meter`, `heading` with a level, `navigation`), and the keyboard patterns those roles promise |
| Windows | The islands carry WinUI's own UI Automation. For what the kit draws: the name, `AutomationId` from `testID`, the heading role, `HelpText` from `accessibilityHint`, and the position in a set through `inSet` on the tab view's drawn tabs. `IsDialog` and `LandmarkType` cannot be set from JavaScript on react-native-windows. |

Three rules the kit follows, learned from what a screen reader said:

- An element referenced by `aria-labelledby` is read whole, `aria-hidden`
  descendants included, so the reference points at a title span and never at
  a container that also holds an icon ligature.
- A tab cannot carry a second announced control on web, so the close cross
  is a pointer affordance and Delete is the keyboard's close, announced by
  `aria-keyshortcuts`.
- A drawn control on Windows gets an explicit label: react-native-windows
  composes no name from the text inside a view.

Every story runs axe at the error level, and the harness reads the
accessibility tree on web, Windows and Android, which is where names that
tests and axe cannot see are checked.

## Where platforms differ

The differences that change what a screen can do, in one place:

| Feature | iOS | Android | Web | Windows |
| --- | --- | --- | --- | --- |
| Swipe actions on `ListItem` | Swipe | Context menu | Context menu | Context menu |
| `Tooltip` | An accessibility hint, nothing visible | Long press | Hover and focus | Hover and focus, not announced |
| `Sheet` material | Yes | No | Yes | No |
| `Alert` action sheet | Yes | Actions stacked | Anchored to the bottom | A dialog |
| Menu `shortcut` | Ignored | Ignored | Ignored | Drawn and bound |
| Menu `swatch` | Not shown | Yes | Yes | Yes |
| `onOpenChange` on menus | Not reported | Yes | Yes | Yes |
| `ContextMenu` `at` | Ignored | Yes | Yes | Yes |
| `PopupMenu` match highlighting | No | No | Yes | No |
| `caretPoint` | `null` | `null` | Yes | `null` |
| `Progress` indeterminate linear | Yes | Yes | Empty bar | Yes |
| `Progress` `trackColor` | Ignored | Yes | Yes | Yes |
| `Badge` `99+` | Yes | Yes | Yes | Shows the cap |
| `Badge` announced name | Label | Number only | Label | Label |
| `SegmentedControl` `size`, `shape` | `pill` only | Yes | Yes | Not applied |
| `Stepper` `formatValue` | Yes | Yes | Yes | Not applied |
| `TextField` `autoCapitalize` | Yes | Yes | Yes | No equivalent |
| `TextField` `submitBehavior` | Native | Native | Yes | Enter keeps focus |
| `SearchField` `clearable` | Yes | Yes | The control's own | The control's own |
| `SearchField` suggestions with icons | Yes | Yes | Text only | Text only |
| `DateTimePicker` time bounds | Yes | Yes | Yes | Date only |
| `FieldGroup` `titleUppercase` | Ignored | Yes | Yes | Yes |
| `TabView` reordering | No | No | No | Off |
| `TabView` close on the keyboard | Button | Button | Delete | The control's cross |
| `Toolbar` overflow decided by the platform | No | No | No | Yes |
| `EmptyState` native | iOS 17+ | Drawn | Drawn | Drawn |
| `Collapsible` children | `@expo/ui` | `@expo/ui` | Any | Any |
| `ExternalLink` | In-app browser | In-app browser | New tab | Default browser |
| Keyboard shortcuts | No | No | No | Yes |
| High contrast palette | No | No | No | Yes |
| Window title and chrome | No | No | No | Yes |

## Verification

- `bun run test` runs the Vitest suite once per platform. A file's name
  decides where it runs: `*.test.ts` on every platform including Windows,
  `*.test.tsx` on iOS, Android and web, `*.native.test.tsx` on iOS and
  Android, and `*.ios.test.tsx`, `*.android.test.tsx`, `*.web.test.tsx` and
  `*.windows.test.tsx` on one. Coverage is 100% on lines, branches, functions
  and statements. The Windows project forbids the modules that have no
  Windows implementation, so a Windows file that reaches for one fails its
  test rather than the app.
- Every story runs in headless Chromium through Vitest browser mode with axe
  at the error level.
- The harness (`scripts/harness/README.md`) opens a route on web, Windows,
  Android or iOS, presses, types, screenshots, and reads the accessibility
  tree a screen reader reads. It is the only way to see what a real renderer
  draws, and it has caught what tests and axe could not.

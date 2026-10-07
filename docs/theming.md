# Theming

[Docs home](README.md)

One accent color seeds the theme on every platform, screens follow the
system's light or dark scheme, and colors are tokens the platform resolves.
Nothing here needs per-platform styling.

## In practice

Set the accent once, at the root:

```tsx
<AccentProvider seed="#8959EA">
  <Navigation/>
</AccentProvider>
```

An accent the user picks may be too faint on one of the backgrounds. Give one
seed per scheme, or ask for a contrast and let the kit find it:

```tsx
<AccentProvider seed={{light: '#0040DD', dark: '#6AA8FF'}}>
<AccentProvider seed={userAccent} minContrast={4.5}>
```

Color your own views with tokens. In a style, use `theme`, which the platform
resolves and keeps current with no re-render:

```tsx
import {StyleSheet} from 'react-native';
import {theme} from 'expo-interface';

const styles = StyleSheet.create({
  card: {backgroundColor: theme.backgroundElement, borderColor: theme.separator},
});
```

Where a prop needs a plain color string, use `useColor`:

```tsx
const label = useColor('label');
```

Let the user force a scheme:

```tsx
<SegmentedControl label="Appearance" selectedValue={mode} onValueChange={next => {
  setMode(next);
  setColorScheme(next);
}}>
  <SegmentedControl.Item label="System" value="system"/>
  <SegmentedControl.Item label="Light" value="light"/>
  <SegmentedControl.Item label="Dark" value="dark"/>
</SegmentedControl>
```

The rest of this page is the reference.

## Accent

`AccentProvider` takes a `seed` and applies it everywhere: one hex for both
schemes, or `{light, dark}` for an accent that reads differently on each
background. The default seed is `ACCENT_SEED`, `#007AFF`.

`minContrast` asks for a contrast ratio against the scheme's background (4.5
is WCAG's for text). A seed short of it in a scheme is made darker on the
light background or lighter on the dark one, keeping its hue, until it
reaches the ratio; a seed that reaches it is kept as it is. `resolveAccent(seed,
minContrast)` is the same computation, for code that wants the result without
a provider.

| Platform | How the seed is applied |
| --- | --- |
| iOS | Verbatim as the SwiftUI `tint` of every host, like a single-color AccentColor asset. |
| Android | The Compose host generates a full Material 3 palette from the seed (the Material You algorithm). |
| Web | `--color-tint` and `--color-on-tint` custom properties on the root element, for the scheme the page is drawn in, so every CSS consumer updates without a re-render. |
| Windows | Every XAML island takes the seed through its own `accentColor` prop and overrides WinUI's accent brushes from it. |

On web the provider also keeps the accent in `localStorage`, under
`ACCENT_STORAGE_KEY` (`expo-interface:accent`). On the next visit
`getThemeBootScript()` paints it before the bundle runs, and
`resolvedPalette()` has it before React does. `persist={false}` leaves the
storage alone.

`useAccentSeed()` returns the active seed for the scheme the app is drawn in.
`currentAccent()` returns the accent the app last provided, both schemes, for
code outside React. `onAccent(seed)` returns black or white for content drawn
on top of it.

## Color scheme

`useColorScheme()` answers `'light'` or `'dark'` from one stable subscription.
React Native's own hook re-subscribes on every render and, on web, can miss
the `matchMedia` event when an ancestor re-renders during it. Every kit
component follows this hook.

`setColorScheme('system' | 'light' | 'dark')` forces a scheme or follows the
system again.

| Platform | What `setColorScheme` does |
| --- | --- |
| iOS, Android | `Appearance.setColorScheme`. |
| Web | Writes the forced palette on the root element with `color-scheme` and `data-theme`, notifies every `Appearance` listener, and saves the choice in `localStorage` (under `SCHEME_STORAGE_KEY`, `expo-interface:scheme`) so `getThemeBootScript()` applies it before the bundle runs. `getThemeCSS()` carries the matching `:root[data-theme]` palettes. |
| Windows | Keeps the forced scheme in JavaScript, as on web, so every island follows it through its `theme` prop, and asks `Appearance.setColorScheme` as well for what react-native-windows draws itself. |

`getColorSchemeMode()` answers the forced mode on web and Windows and
`'system'` natively, where the forced scheme is `Appearance`'s own.

On web a forced scheme survives a reload. `getThemeBootScript()` applies it to
the page before the bundle runs, and the kit reads it back when it loads, so
`useColorScheme` and `resolvedPalette()` answer it from the first render.
`restoreColorScheme(storageKey)` does the reading, for an app that saves the
scheme under a key of its own.

A static web export is rendered light, since the server has no scheme to
read. `useColorScheme` hydrates in light too, so the page matches its HTML,
and then renders in the scheme the browser reports. The CSS variables follow
the media query and the boot script's `data-theme` from the first paint, so
only colors computed in JavaScript wait for that render.

## Tokens

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
| `switchOn` | Track of a switch in the on position, the platform's green |
| `success` | A state that went well: a finished upload, a peer online, a check that passed |
| `destructive` | Delete buttons, failed states and other destructive actions |
| `onDestructive` | Text and icons drawn on top of `destructive` |
| `highlight` | The fill behind marked text: a quote, a search hit. Opaque in both schemes, so an editor that takes a plain `#rrggbb` can take it as it is |
| `opaqueSeparator` | The separator as an opaque color, for a canvas or an image edge that cannot blend the translucent one |

Each token resolves to a platform value the OS keeps current:

| Platform | `theme.<token>` resolves to |
| --- | --- |
| iOS | A `PlatformColor` (the iOS system colors) |
| Android | A theme attribute |
| Web | A `var(--color-*)` custom property |
| Windows | A Fluent theme resource where one matches: `label` is `TextFillColorPrimary`, `background` is `SolidBackgroundFillColorBase`, `separator` is `ControlStrokeColorDefault`. `tint`, `onTint`, `switchOn`, `success`, `destructive`, `onDestructive`, `highlight` and `opaqueSeparator` have no Fluent twin and keep the palette literal. |

## Reading colors

| Export | What it returns |
| --- | --- |
| `theme` | One entry per token as an opaque platform value, for styles. The OS resolves it and updates it when the scheme changes, with no re-render. |
| `useColor(token)` | A plain color string that tracks the scheme and the accent, for props that cannot take a platform color object (symbol tints, `@expo/ui` components). On web it hands out the CSS variable. |
| `usePalette()` | The resolved palette of the current scheme as plain strings on every platform, with the live accent as `tint`. For canvases, native views and anything that cannot read a variable. |
| `resolvedPalette()` | The same palette outside React: the scheme the app is drawn in, and the accent it last provided (on web, the one an earlier visit saved until the provider mounts). For code that runs before the first render, such as an editor's assets built at import. |
| `isColorToken(value)` | Whether a string names a palette token rather than being a color. |
| `useNavTheme()` | A React Navigation theme built from the palette and the accent. |
| `colors` | The raw light and dark palettes. |
| `getThemeCSS()` | The palette as CSS variables, and the body painted in the scheme's background, for `+html.tsx`. |
| `getThemeBootScript()` | The script that applies a saved forced scheme and a saved accent before the bundle runs, for `+html.tsx`. |

## High contrast

On Windows with `expo-windows`, while the user has a high contrast theme on,
`useColor`, `usePalette` and `useNavTheme` answer the theme's own colors: text
and separators in its text color, surfaces in its window and control faces,
the accent as its highlight. They follow the user turning it on or off.
`useHighContrast()` reads the setting (`enabled`, the theme's `scheme` name
and its `colors`) for anything that draws outside the palette, and
`highContrastPalette(colors)` is the mapping. A selected surface takes a
control face rather than the highlight, so a selection shows through its
outline, as the themes mean it to. Everywhere else the setting is off.

## Constants

| Export | What |
| --- | --- |
| `spacing` | `half` to `six`, 2 to 64 points |
| `bound.contentMaxWidth` | 800 points; `Screen`, headers and forms cap content at it on wide screens |
| `inset` | The top bar and bottom tab heights `Screen` pads for, per platform |
| `fonts` | The system faces: `system-ui` on iOS, CSS variables on web, Segoe UI Variable on Windows |
| `fontWeights` | `normal` to `heavy` |
| `variants` | The type scale, per platform: the iOS scale on iOS and web, the Material scale on Android, the Fluent ramp on Windows |

The theme module also exports helpers the kit's own web files use: `flatten`,
`clamp`, `getPlatformToken`, `nav`, `VALID_STYLES` and `EXPAND_KEYS`. They are
not part of the documented API and may change.

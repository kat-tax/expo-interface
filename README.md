# Expo Interface

> A cross-platform UI kit for [Expo](https://expo.dev) built on
[`@expo/ui`](https://docs.expo.dev/versions/v57.0.0/sdk/ui/):

- Every component renders the platform's own control.
- SwiftUI on iOS, Jetpack Compose (Material 3) on Android, plain DOM on web.
- A single accent color seeds the theme everywhere, on all platforms.

## Install

```sh
npx expo install expo-interface @expo/ui @expo/material-symbols
```

Peer dependencies and Android icon setup are covered in
[install details](#install-details).

## Setup

1. Wrap the app in `AccentProvider`. `seed` is any hex color; the default is `#007AFF`.
   ```tsx
   // app/_layout.tsx
   import {ThemeProvider, Stack} from 'expo-router';
   import {AccentProvider, useNavTheme} from 'expo-interface';

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
   script that applies a scheme the user forced (see `setColorScheme`) before
   the bundle runs.

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

3. Build screens.

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

## Components

Everything is exported from `expo-interface`. Component names link to their
props. Value controls are controlled: pair `value` with `onValueChange`.

Each component renders the native control of its platform (SwiftUI, Material 3
Compose, or a DOM element). Web overlays use the Popover API, CSS anchor
positioning and `<dialog>`.

| Component | Description | iOS | Android | Web |
| --- | --- | :-: | :-: | :-: |
| [Screen](src/screen/index.tsx) | Screen container that handles safe areas, status bar, background and content width, optionally hosting native content and placing a floating action button | ✓ | ✓ | ✓ |
| [ScreenHeader](src/screen/header.tsx) | Simple header bar with an optional back button and a trailing slot | ✓ | ✓ | ✓ |
| [HeaderMenu](src/header-menu/index.tsx) | Menu for a stack header's trailing slot; survives Android's header re-parenting on a tab switch | ✓ | ✓ | ✓ |
| [HeaderAction](src/header-action/index.tsx) | The same trigger with a press instead of a menu: a plain action at the platform's header size | ✓ | ✓ | ✓ |
| [HeaderActions](src/header-actions/index.tsx) | Row of header controls for a slot that takes one node, spaced the way each platform spaces its own — and one host for all of them | ✓ | ✓ | ✓ |
| [NativeHost](src/host/index.tsx) | Accent-seeded `@expo/ui` host for controls that sit inside a React Native layout | ✓ | ✓ | ✓ |
| [Surface](src/surface/types.ts) | A box in the theme's colors — a bar, a floating strip, a card, a drop target — drawn in React Native so it can hold what is not native | ✓ | ✓ | ✓ |
| [Toolbar](src/toolbar/types.ts) | Bar of tools along a canvas: the controls are one native view, with an optional React Native field between the groups and a compact density for many tools | ✓ | ✓ | ✓ |
| [KeyboardBar](src/keyboard/index.tsx) | Bottom bar that sticks to the keyboard and reports its height (`react-native-keyboard-controller`, optional) | ✓ | ✓ | ✓ |
| [Tabs](src/tabs/types.ts) | Tab bar for `expo-router`: native tabs on iOS and Android, a floating top bar with a logo and action slots on web, which takes the screen's header; can be hidden | ✓ | ✓ | ✓ |
| [TabStack](src/tab-stack/index.tsx) | Preconfigured `expo-router` stack for the root screen of a tab, with a header trailing slot | ✓ | ✓ | ✓ |
| [ConstrainedStackHeader](src/stack-header/index.tsx) | Stack header that matches the content max-width on web; `TabStack` uses it there so a screen has a header on every platform, and it folds into the tab bar where there is one | | | ✓ |
| [Sheet](src/sheet/index.tsx) | Bottom sheet that inherits the accent color | ✓ | ✓ | ✓ |
| [FieldGroup](src/field-group/types.ts) | Scrollable settings form made of titled sections of rows, each with an optional footer note | ✓ | ✓ | ✓ |
| [ListItem](src/list-item/types.ts) | Tappable row with leading, trailing and supporting text slots and an optional trailing text action | ✓ | ✓ | ✓ |
| [Card](src/card/types.ts) | Pressable surface with header, body, footer, and floating badge and overlay slots outside its press target | ✓ | ✓ | ✓ |
| [Fab](src/fab/types.ts) | Floating action button: Material 3 on Android, drawn in SwiftUI on iOS, a DOM button on web; can open a menu | ✓ | ✓ | ✓ |
| [Collapsible](src/collapsible/types.ts) | Row that expands and collapses its content | ✓ | ✓ | ✓ |
| [Divider](src/divider/types.ts) | Horizontal or vertical hairline separator | ✓ | ✓ | ✓ |
| [Avatar](src/avatar/types.ts) | A person as a colored circle with their initials, hashed from the name | ✓ | ✓ | ✓ |
| [Button](src/button/types.ts) | Filled, outlined or text button with optional icons, sizes, shapes and a destructive role | ✓ | ✓ | ✓ |
| [TextField](src/text-field/types.ts) | Single or multiline text input with keyboard type, capitalization and secure entry | ✓ | ✓ | ✓ |
| [Switch](src/switch/types.ts) | On/off toggle with a leading label | ✓ | ✓ | ✓ |
| [IconToggle](src/icon-toggle/types.ts) | Round icon button with two states: the outline when off, the filled glyph when on | ✓ | ✓ | ✓ |
| [Checkbox](src/checkbox/types.ts) | Checked/unchecked box with a leading label | ✓ | ✓ | ✓ |
| [ColorPicker](src/color-picker/types.ts) | Label with a color well that opens the iOS-style color picker (Grid, Spectrum, Sliders, opacity), optionally with preset swatches | ✓ | ✓ | ✓ |
| [Slider](src/slider/types.ts) | Thumb dragged along a continuous or stepped range | ✓ | ✓ | ✓ |
| [Stepper](src/stepper/types.ts) | Number adjusted with increment and decrement buttons | ✓ | ✓ | ✓ |
| [Picker](src/picker/types.ts) | Dropdown that selects one option from a list | ✓ | ✓ | ✓ |
| [SegmentedControl](src/segmented/types.ts) | Row of segments that selects one option | ✓ | ✓ | ✓ |
| [DateTimePicker](src/date-time/types.ts) | Picks a date, a time or both, with optional bounds | ✓ | ✓ | ✓ |
| [Progress](src/progress/types.ts) | Linear bar or circular ring, determinate or indeterminate | ✓ | ✓ | ✓ |
| [Spinner](src/spinner/index.tsx) | The platform's activity indicator, in a host of its own when it sits in a React Native layout | ✓ | ✓ | ✓ |
| [Gauge](src/gauge/types.ts) | Value within a range in the SwiftUI gauge styles: capacity bars, marker bar, open or closed ring | ✓ | ✓ | ✓ |
| [Menu](src/menu/types.ts) | Dropdown menu of actions opened from a button (or a text link on web); items can be checked or carry a color swatch | ✓ | ✓ | ✓ |
| [ContextMenu](src/menu/types.ts) | Menu of actions opened by long-pressing (or right-clicking) its content, or at a point the content reports | ✓ | ✓ | ✓ |
| [PopupMenu](src/popup-menu/types.ts) | The platform's menu opened at a point over content the kit did not draw: a canvas, a WebView, an editor | ✓ | ✓ | ✓ |
| [Popover](src/popover/types.ts) | Card pointing at a rectangle on a canvas, with a title, a message and action chips | ✓ | ✓ | ✓ |
| [Tooltip](src/tooltip/types.ts) | Short hint shown on hover, focus or long-press; an accessibility hint on iOS | | ✓ | ✓ |
| [Alert](src/alert/types.ts) | Modal dialog or action sheet with a title, message and actions; mounts its own host natively, so it can be rendered anywhere | ✓ | ✓ | ✓ |
| [Toast](src/toast/types.ts) | Brief message over the screen: the Material `Snackbar` on Android, a drawn capsule on iOS and web | ✓ | ✓ | ✓ |
| [ExternalLink](src/router/external-link.tsx) | Link that opens in an in-app browser on native and a new tab on web | ✓ | ✓ | ✓ |
| [Typography](src/typography/types.ts) | Text in the platform type scale, with `Title`, `Body`, `Caption` and other variants as shortcuts | ✓ | ✓ | ✓ |

### Hosts

Native views live inside an `@expo/ui` host. `Screen native` mounts one around
a whole screen; where a screen cannot be native — a canvas, an editor, a list
of React Native rows — `NativeHost` mounts one around a group of controls, at
the accent seed the screen would have used.

Three components mount a host themselves when there is none above them, so
they can be rendered anywhere in a React Native tree: `Alert`, `Spinner` and
`PopupMenu` (`Toast` and `Toolbar` do the same for the parts of them that are
native). Inside a host they render bare, since hosts cannot nest. `useNativeHost()`
reports whether there is one above, for components of your own that need the
same choice.

### Forms in a sheet

`FieldGroup` is not only for a settings tab: a `Sheet` full of one is how the
kit does a form. The question is the section's title and the note under it is
the section's footer, so the sheet needs no headings of its own.

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

### Icons

Icon props take an `IconToken`: an `expo-symbols` name, or a
`{ios, android, web}` map, plus an optional Android drawable. Keep drawables in
an `.android.ts` file so the XML is only bundled there.

```ts
// icons.drawables.android.ts
import share from '@expo/material-symbols/share.xml';
export const drawables = {share};

// icons.drawables.ts
export const drawables: Record<string, ImageSourcePropType | undefined> = {};

// icons.ts
import {icon} from 'expo-interface';
import {drawables} from './icons.drawables';
export const share = icon(
  {ios: 'square.and.arrow.up', android: 'share', web: 'share'},
  drawables.share,
);
```

#### Filled icons

`fill` asks for the solid form of the same symbol — the star a favourite gets,
the heart a like — so a toggle names its icon once rather than twice:

```ts
export const star = icon({ios: 'star', android: 'star', web: 'star'}, drawables.star);
export const starFilled = icon(
  {ios: 'star', android: 'star', web: 'star'},
  drawables.star_fill,
  {fill: true},
);

<IconToggle label="Favourite" icon={star} activeIcon={starFilled} .../>
```

Each platform draws it from what it has:

| Platform | How a filled token draws | What the app provides |
| --- | --- | --- |
| iOS | SF Symbols' own `.fill` name (`star` → `star.fill`); a token that already names a solid symbol keeps it | nothing |
| Web | the `FILL 1` axis of the Material Symbols **variable** font | the variable family (below) |
| Android | the token's `drawable`, which has to be the filled vector — Compose renders XML vectors, not font glyphs | `npx add-material-symbols --fill star` |

`expo-symbols` bundles a static Material Symbols instance cut at `FILL 0`,
which carries no variable axes, so filled icons on web need the variable
family registered under `Material Symbols Outlined` — or under a name of your
own in `--ui-symbol-font`:

```css
@font-face {
  font-family: 'Material Symbols Outlined';
  src: url('./assets/MaterialSymbolsOutlined.woff2') format('woff2-variations');
  font-weight: 100 700;
  font-display: block;
}
```

Serve it from the app's own bundle rather than a CDN so an offline web build
still draws. Without the family a filled token quietly draws its outline; the
static instance stays as the fallback, so unfilled icons need no setup at all.

### Colors

- Follow the system's light or dark scheme and take a color tint from the `AccentProvider` seed.
- A screen looks native on each platform without any per-platform styling.
- There are two ways to read colors: `theme` in styles, and `useColor` everywhere else.

#### `useColor`

Returns a color token as a plain string that tracks the active scheme and accent.
Use it for props that won't accept a platform color object from `theme`, such as
symbol tints or `@expo/ui` components:
```tsx
import {SymbolView} from 'expo-symbols';
import {useColor} from 'expo-interface';

// Inside a component...
const tint = useColor('tint');

// Inside component return...
<SymbolView name="star" tintColor={tint}/>
```

#### `theme`

A static object with one entry per color token. Each entry is a platform color reference (`PlatformColor` on iOS, a theme attribute on Android, a CSS variable on web).

The OS resolves the actual value and updates it when the scheme changes, with no re-render required:

```tsx
import {theme} from 'expo-interface';

// Inside a component...
<View style={{
  backgroundColor: theme.backgroundElement,
  borderColor: theme.separator,
}}/>
```

#### Color Tokens

| ID | Description |
| --- | --- |
| `label` | Primary text: titles, body copy and row labels |
| `secondaryLabel` | Secondary text: subtitles, captions and supporting text |
| `tertiaryLabel` | Placeholders, disabled hints and decorative glyphs such as chevrons |
| `background` | Screen background behind all content |
| `backgroundElement` | Raised or inset surfaces: cards, sheets and grouped list rows |
| `backgroundSelected` | Background of a selected or pressed element |
| `separator` | Hairline separators between rows and borders around controls |
| `pillBackground` | Track behind pill-shaped controls: pickers, segments, steppers |
| `tint` | Interactive elements such as buttons, switches and links; the accent seed |
| `onTint` | Text and icons drawn on top of `tint`, for example a filled button label |
| `switchTrack` | Track of a switch in the off position |
| `switchOn` | Success states such as a completed upload |
| `destructive` | Delete buttons, failed states and other destructive actions |
| `onDestructive` | Text and icons drawn on top of `destructive` |

#### `usePalette`

Returns the resolved palette of the current scheme as plain color strings on
every platform, with the live accent as `tint`. `useColor` stays the right
call for styles (on web it hands out the CSS variable, which follows the
scheme without a re-render); `usePalette` is for canvases, native views and
anything else that cannot read a variable:

```tsx
const palette = usePalette();
canvas.setTheme({background: palette.background, text: palette.label, link: palette.tint});
```

#### Color scheme

`useColorScheme()` answers `'light'` or `'dark'` from one stable subscription
(React Native's own hook re-subscribes on every render and, on web, can miss
the `matchMedia` event when an ancestor re-renders during it). Every kit
component follows it.

`setColorScheme('system' | 'light' | 'dark')` forces a scheme or follows the
system again: `Appearance.setColorScheme` natively; on web (which has no such
call) the palette of the forced scheme is written on the root element along
with `color-scheme` and `data-theme`, every `Appearance` listener hears the
change, and the choice is saved in `localStorage` so `getThemeBootScript()`
in `+html.tsx` applies it before the bundle runs. `getThemeCSS()` carries the
matching `:root[data-theme]` palettes.

```tsx
<SegmentedControl label="Theme" selectedValue={mode} onValueChange={mode => {
  setMode(mode);
  setColorScheme(mode);
}}>
```

#### Other exports

| Export | Purpose |
| --- | --- |
| `useNavTheme()` | React Navigation theme built from the palette and accent |
| `getThemeCSS()` | Palette as CSS variables, for `+html.tsx` |
| `getThemeBootScript()` | Script applying a saved forced scheme before the bundle runs, for `+html.tsx` |
| `useColorScheme()`, `setColorScheme()` | The scheme as a store, and forcing it |
| `usePalette()` | Resolved palette as plain colors |
| `colors` | Raw light and dark palettes |
| `spacing`, `bound`, `inset` | Layout constants |
| `fonts`, `fontWeights`, `variants` | Type constants |

### Keyboard

`KeyboardBar` is a bottom bar that sticks to the keyboard by a transform,
never a resize, and reports the keyboard's height through `onKeyboard` so the
content above it can pad or scroll by that much. It needs
`react-native-keyboard-controller`, an optional peer the kit loads only
natively (the library's Reanimated cannot render on the server, so nothing of
it reaches the web bundle, where the bar is a plain view); `AccentProvider`
mounts its `KeyboardProvider` when the library is installed.

```sh
npx expo install react-native-keyboard-controller
```

`TextField` takes `returnKeyType` and `submitBehavior` for the keyboard's
action key, and its `inline` variant is a borderless React Native input for a
field inside a React Native layout, which focuses on mount with `autoFocus`
and makes sure the keyboard came on Android.

### Menus and headers

`Menu` items take `active` (a check mark) and `swatch` (a color dot);
`ContextMenu` opens at a point its content reports through `at`. On web
`Menu` renders a text link with `trigger="link"`, for a bar. `HeaderMenu` is
the menu for a stack header's trailing slot (`TabStack`'s `headerRight`): on
Android the native stack re-parents the header's views on a tab switch, which
a Compose view refuses, so its host is rebuilt on every focus change.

```tsx
<TabStack title="Documents" headerRight={() => <HeaderMenu label="New…" icon={icon.add} items={items}/>}/>
```

`HeaderAction` is the same trigger with a press instead of a menu, and
`HeaderActions` is the row for a slot that takes one node:

```tsx
headerRight={() => (
  <HeaderActions>
    <HeaderAction label="Share" icon={icon.share} hideLabel tone="label" onPress={share}/>
    <HeaderMenu label="Export" icon={icon.export} hideLabel tone="label" items={exports}/>
  </HeaderActions>
)}
```

A plain `Button` is the wrong thing in a header: the app would have to size it
itself, it would not shrink when the web tab bar carries the header, and
natively it is a SwiftUI or Compose view, which a React Native header cannot
hold without a host. The row spaces its children the way each platform spaces
its own header actions — none on Android, where Material's icon buttons carry
their own 48dp container, which is the app bar's action pitch — and is the one
host for all of them, rather than one host per control.

On web a screen under `Tabs` has one bar over it, not two: `ConstrainedStackHeader`
hands its header to the floating tab bar and draws nothing itself, so the bar
is the screen's header. A pushed screen hands over all of it — the back button
in the mark's place, the title where the app's name goes, `headerRight` where
`webActions` go. A tab's own screen hands over `headerRight` alone and keeps
its title, since the tab beside it in the bar is already saying it. Only the
focused screen's header is in the bar, so returning to a tab does not find the
one you left there.

The bar keeps the height of its tabs, and a header control folded into it
drops to their size. `Tabs hidden` hides the tabs rather than the bar while a
pushed screen's header is folded in, leaving a screen that takes the whole
display with its title and the way back; `webFoldHeader={false}` keeps the two
rows.

## Install details

The components are built on standard Expo modules, which are peer
dependencies.

Most Expo Router apps already have these dependencies, but incase any are missing:

```sh
npx expo install expo-router expo-symbols expo-asset expo-image expo-constants expo-status-bar expo-system-ui expo-web-browser react-native-safe-area-context
```

Jetpack Compose draws icons from XML vector drawables, which
`@expo/material-symbols` provides. Register the extension in
`metro.config.js`:

```js
const {getDefaultConfig} = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('xml');
module.exports = config;
```

## Development

The [example](./example) app, dropfiles, uses every component and imports the
package from `../src`, so it doubles as the development harness.

```sh
bun install        # bun >= 1.4
bun run web        # or ios, android
bun run typecheck  # package, example and storybook
bun run lint       # oxlint
bun run test       # vitest, once per platform (ios, android, web)
bun run test:ui    # vitest watch mode with the browser UI
```

### Storybook

Stories live next to each component (`src/<name>/<name>.stories.tsx`) and are
shared by two Storybooks in the [storybook](./storybook) workspace:

- **Web** (`storybook/.storybook`): `@storybook/react-native-web-vite`, so the
  site has the full Storybook manager — MDX guides in `storybook/docs/`, an
  autogenerated docs page with a props table per component, controls, a
  black/white theme that follows the OS scheme and a toolbar to force light or
  dark. This is the documentation site published to GitHub Pages.
- **On-device** (`storybook/.rnstorybook`): `@storybook/react-native` through
  Metro, rendering the real SwiftUI and Compose controls on iOS and Android.

```sh
bun run storybook:web      # web storybook + docs site (Vite)
bun run storybook:ios      # or storybook:android — on-device storybook
bun run storybook:build    # static web build in storybook/dist
bun run storybook:test     # every story as a Vitest test in headless Chromium
```

The shared decorator (`storybook/src/frame.tsx`) wraps stories in
`AccentProvider` and an accent-seeded `@expo/ui` `Host`. Stories built from
plain React Native views opt out with `parameters: {native: false}`; a story
can pick an accent with `parameters: {accent: '#8959EA'}`. The web build runs
the kit through Vite with the same Metro-compat plugin as the Vitest web
project (`vitest/metro-compat.ts`).

### Tests

Vitest (`vitest-expo`) runs the suite three times — an ios, android and web
project — so each `index.ios.tsx` / `index.android.tsx` / `index.web.tsx`
implementation is exercised (`vitest.config.mts`; the web pipeline lives in
`vitest.config.web.mts`). The file name picks the platforms:

| Pattern | Platforms |
| --- | --- |
| `*.test.ts(x)` | ios, android, web |
| `*.native.test.tsx` | ios, android |
| `*.ios.test.tsx` / `*.android.test.tsx` | one platform |
| `*.web.test.tsx` | web |

Web tests use `@testing-library/react` against the real DOM (jsdom +
react-native-web). Native tests run real React Native and use
`@testing-library/react-native`; `@expo/ui` controls render as host views whose
props are the payload sent to SwiftUI/Compose, and `src/__tests__/native.ts`
has helpers to assert on them. `bun run test:coverage` writes an interactive
HTML test report to `test-report/` and coverage to `coverage/`.

The stories double as tests: `@storybook/addon-vitest`
(`storybook/vitest.config.mts`) renders every web story in headless Chromium
through Vitest browser mode, so a story that throws while mounting fails the
run, and `@storybook/addon-a11y` runs axe-core on each rendered story as part
of it (`parameters.a11y.test: 'error'`; the `color-contrast` rule is off
because the palette follows the iOS system colors). `bun run storybook:test` runs them from the CLI (Playwright's Chromium
must be installed: `bunx playwright install chromium` in `storybook/`); in
`storybook:web` the testing widget at the bottom of the sidebar runs them
live.

### CI

GitHub Actions ([.github/workflows](./.github/workflows)):

- **CI** (`ci.yml`) — on every push and pull request: typecheck, lint, tests
  (HTML report and coverage as artifacts), a Metro export of the example app
  for ios, android and web (proves every platform file and
  `@expo/material-symbols` asset resolves without Xcode or Gradle), and a web
  Storybook build uploaded as an artifact after its stories pass as Vitest
  browser tests.
- **Storybook** (`storybook.yml`) — on push to `master`: publishes the web
  Storybook to GitHub Pages, with the Vitest HTML report at `/tests` and
  coverage at `/coverage`. Enable Pages with the "GitHub Actions" source in
  the repository settings.
- **Release** (`release.yml`) — on a `v*` tag matching `package.json`:
  re-runs the checks, publishes to npm with provenance (needs an `NPM_TOKEN`
  secret) and creates a GitHub release with generated notes.

## License

MIT

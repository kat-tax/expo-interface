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

2. On web, emit the palette as CSS variables in the root HTML.

   ```tsx
   // app/+html.tsx
   import {ScrollViewStyleReset} from 'expo-router/html';
   import {getThemeCSS} from 'expo-interface';

   export default function Root({children}: React.PropsWithChildren) {
     return (
       <html lang="en">
         <head>
           <meta charSet="utf-8"/>
           <meta name="viewport" content="width=device-width, initial-scale=1"/>
           <style dangerouslySetInnerHTML={{__html: getThemeCSS()}}/>
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
| [Screen](src/screen/index.tsx) | Screen container that handles safe areas, status bar, background and content width, optionally hosting native content | ✓ | ✓ | ✓ |
| [ScreenHeader](src/screen/header.tsx) | Simple header bar with an optional back button and a trailing slot | ✓ | ✓ | ✓ |
| [Tabs](src/tabs/types.ts) | Tab bar for `expo-router`: native tabs on iOS and Android, a floating top bar with a logo on web | ✓ | ✓ | ✓ |
| [TabStack](src/tab-stack/index.tsx) | Preconfigured `expo-router` stack for the root screen of a tab | ✓ | ✓ | ✓ |
| [ConstrainedStackHeader](src/stack-header/index.tsx) | Stack header that matches the content max-width on web | | | ✓ |
| [Sheet](src/sheet/index.tsx) | Bottom sheet that inherits the accent color | ✓ | ✓ | ✓ |
| [FieldGroup](src/field-group/index.tsx) | Scrollable settings form made of titled sections of rows | ✓ | ✓ | ✓ |
| [ListItem](src/list-item/types.ts) | Tappable row with leading, trailing and supporting text slots | ✓ | ✓ | ✓ |
| [Collapsible](src/collapsible/types.ts) | Row that expands and collapses its content | ✓ | ✓ | ✓ |
| [Divider](src/divider/types.ts) | Horizontal or vertical hairline separator | ✓ | ✓ | ✓ |
| [Button](src/button/types.ts) | Filled, outlined or text button with optional icons, sizes, shapes and a destructive role | ✓ | ✓ | ✓ |
| [TextField](src/text-field/types.ts) | Single or multiline text input with keyboard type, capitalization and secure entry | ✓ | ✓ | ✓ |
| [Switch](src/switch/types.ts) | On/off toggle with a leading label | ✓ | ✓ | ✓ |
| [Checkbox](src/checkbox/types.ts) | Checked/unchecked box with a leading label | ✓ | ✓ | ✓ |
| [Slider](src/slider/types.ts) | Thumb dragged along a continuous or stepped range | ✓ | ✓ | ✓ |
| [Stepper](src/stepper/types.ts) | Number adjusted with increment and decrement buttons | ✓ | ✓ | ✓ |
| [Picker](src/picker/types.ts) | Dropdown that selects one option from a list | ✓ | ✓ | ✓ |
| [SegmentedControl](src/segmented/types.ts) | Row of segments that selects one option | ✓ | ✓ | ✓ |
| [DateTimePicker](src/date-time/types.ts) | Picks a date, a time or both, with optional bounds | ✓ | ✓ | ✓ |
| [Progress](src/progress/types.ts) | Linear bar or circular ring, determinate or indeterminate | ✓ | ✓ | ✓ |
| [Menu](src/menu/types.ts) | Dropdown menu of actions opened from a button | ✓ | ✓ | ✓ |
| [ContextMenu](src/menu/types.ts) | Menu of actions opened by long-pressing (or right-clicking) its content | ✓ | ✓ | ✓ |
| [Tooltip](src/tooltip/types.ts) | Short hint shown on hover, focus or long-press; an accessibility hint on iOS | | ✓ | ✓ |
| [Alert](src/alert/types.ts) | Modal dialog or action sheet with a title, message and actions | ✓ | ✓ | ✓ |
| [QRCode](src/qr/index.tsx) | Renders a value as a QR code image | ✓ | ✓ | ✓ |
| [ExternalLink](src/router/external-link.tsx) | Link that opens in an in-app browser on native and a new tab on web | ✓ | ✓ | ✓ |
| [Typography](src/typography/types.ts) | Text in the platform type scale, with `Title`, `Body`, `Caption` and other variants as shortcuts | ✓ | ✓ | ✓ |

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

#### Other exports

| Export | Purpose |
| --- | --- |
| `useNavTheme()` | React Navigation theme built from the palette and accent |
| `getThemeCSS()` | Palette as CSS variables, for `+html.tsx` |
| `colors` | Raw light and dark palettes |
| `spacing`, `bound`, `inset` | Layout constants |
| `fonts`, `fontWeights`, `variants` | Type constants |

## Install details

The components are built on standard Expo modules, which are peer
dependencies.

Most Expo Router apps already have these dependencies, but incase any are missing:

```sh
npx expo install expo-router expo-symbols expo-image expo-constants expo-status-bar expo-system-ui expo-web-browser react-native-safe-area-context
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
bun run lint       # eslint (eslint-config-expo)
bun run test       # vitest, once per platform (ios, android, web)
bun run test:ui    # vitest watch mode with the browser UI
```

### Storybook

Stories live next to each component (`src/<name>/<name>.stories.tsx`) and run
in the [storybook](./storybook) app, an Expo project built on
`@storybook/react-native`, so every story renders the real SwiftUI, Compose
or DOM control through Metro.

```sh
bun run storybook:web      # storybook in the browser
bun run storybook:ios      # or storybook:android — on-device storybook
bun run storybook:build    # static web export in storybook/dist
```

The global decorator (`storybook/.rnstorybook/preview.tsx`) wraps stories in
`AccentProvider` and an accent-seeded `@expo/ui` `Host`. Stories built from
plain React Native views opt out with `parameters: {native: false}`.

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

### CI

GitHub Actions ([.github/workflows](./.github/workflows)):

- **CI** (`ci.yml`) — on every push and pull request: typecheck, lint, tests
  (HTML report and coverage as artifacts), a Metro export of the example app
  for ios, android and web (proves every platform file and
  `@expo/material-symbols` asset resolves without Xcode or Gradle), and a web
  Storybook build uploaded as an artifact.
- **Storybook** (`storybook.yml`) — on push to `master`: publishes the web
  Storybook to GitHub Pages, with the Vitest HTML report at `/tests` and
  coverage at `/coverage`. Enable Pages with the "GitHub Actions" source in
  the repository settings.
- **Release** (`release.yml`) — on a `v*` tag matching `package.json`:
  re-runs the checks, publishes to npm with provenance (needs an `NPM_TOKEN`
  secret) and creates a GitHub release with generated notes.

## License

MIT

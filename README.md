# Expo Interface

> A cross-platform UI kit for [Expo](https://expo.dev) built on
[`@expo/ui`](https://docs.expo.dev/versions/v57.0.0/sdk/ui/).

- Every component renders the platform's own control: SwiftUI on iOS,
  Jetpack Compose (Material 3) on Android, the DOM on web, WinUI 3 on Windows
  through react-native-windows.
- One accent color seeds the theme on every platform, and screens follow the
  system's light or dark scheme without per-platform styling.

[The expo-interface document](docs/expo-interface.md) describes every
component, what each platform renders, and where the platforms differ.
[The expo-windows document](docs/expo-windows.md) describes the Windows
platform runtime that lives in this repository.

## Install

```sh
npx expo install expo-interface @expo/ui @expo/material-symbols
```

The peer dependencies are standard Expo modules that most Expo Router apps
already have. If any are missing:

```sh
npx expo install expo-router expo-symbols expo-asset expo-image expo-constants expo-status-bar expo-system-ui expo-web-browser react-native-safe-area-context
```

## Setup

1. Wrap the app in `AccentProvider` and use the kit's `Stack` in the root
   layout. `seed` is any hex color; the default is `#007AFF`. The kit's
   `Stack` is Expo Router's native stack on iOS, Android and web, and a stack
   of its own on Windows, where there is no native one.

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

2. On web, emit the palette as CSS variables in the root HTML, with the boot
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

## Components

Everything is exported from `expo-interface`. Value controls are controlled:
pair `value` with `onValueChange`.

| Group | Components |
| --- | --- |
| Layout | `Screen`, `ScreenHeader`, `NativeHost`, `Surface`, `Card`, `Toolbar`, `KeyboardBar`, `FieldGroup`, `ListItem`, `Collapsible`, `Divider`, `EmptyState` |
| Navigation | `Stack`, `Tabs`, `TabStack`, `ConstrainedStackHeader`, `TabView`, `Pager`, `HeaderMenu`, `HeaderAction`, `HeaderActions`, `ExternalLink`, `ShareLink` |
| Controls | `Button`, `Chip`, `IconToggle`, `Switch`, `Checkbox`, `TextField`, `SearchField`, `Picker`, `SegmentedControl`, `Slider`, `Stepper`, `DateTimePicker`, `ColorPicker` |
| Indicators | `Progress`, `Spinner`, `Gauge`, `Badge`, `Avatar`, `Typography` and its variants |
| Overlays | `Menu`, `ContextMenu`, `PopupMenu`, `Popover`, `Tooltip`, `Alert`, `Sheet`, `Toast` |
| Theme | `AccentProvider`, `theme`, `useColor`, `usePalette`, `useColorScheme`, `setColorScheme`, `useNavTheme`, `getThemeCSS`, `getThemeBootScript`, `icon` |

[The expo-interface document](docs/expo-interface.md) has each one in full.

## Windows

On Windows each component's `index.windows.tsx` renders a Fabric native
component from the kit's own C++ library, `windows/ExpoInterface`, which
hosts the WinUI control in a XAML island, themed by Fluent and branded from
the accent seed. What has no WinUI control is drawn with Fluent metrics in
Segoe UI Variable, and icons are Segoe Fluent Icons.

The platform itself comes from [expo-windows](expo-windows/README.md): the
Metro config, the Expo SDK on Windows, and the CLI that writes, builds and
packages the app. The kit's library is autolinked into that app, and the
codegen headers for its specs ship with the package.

Expo SDK 57 pins React Native 0.86, and react-native-windows' newest line is
0.84. The kit and the runtime are built and tested against that line with
Expo 57's JavaScript, which is what `scripts/windows-ci.sh` does on every
change. An app on Expo 57 follows the matching react-native-windows release
without changes here.

## Development

The [example](./example) app, dropfiles, uses every component and imports
the package from `../src`.

```sh
bun install        # bun >= 1.4
bun run web        # or ios, android
bun run typecheck  # package, expo-windows, example and storybook
bun run lint       # oxlint
bun run test       # vitest, every platform project
bun run test:ui    # vitest watch mode with the browser UI
```

### Storybook

Stories live next to each component (`src/<name>/<name>.stories.tsx`) and are
shared by two Storybooks in the [storybook](./storybook) workspace: a web one
with MDX guides, a props table per component and the testing widget, which is
the documentation site published to GitHub Pages, and an on-device one that
renders the real SwiftUI and Compose controls.

```sh
bun run storybook:web      # web storybook and docs site
bun run storybook:ios      # or storybook:android
bun run storybook:build    # static web build in storybook/dist
bun run storybook:test     # every story as a Vitest browser test, with axe
```

### Tests

Vitest runs the suite once per platform (`ios`, `android`, `windows`, `web`)
plus the runtime's two projects. The projects, the test helpers and the
harness are the [`expo-vitest`](expo-vitest/README.md) workspace. A file's name
decides where it runs:

| Pattern | Platforms |
| --- | --- |
| `*.test.ts` | ios, android, windows, web |
| `*.test.tsx` | ios, android, web |
| `*.native.test.tsx` | ios, android |
| `*.ios.test.tsx`, `*.android.test.tsx`, `*.web.test.tsx`, `*.windows.test.tsx` | one platform |

Coverage is 100% on lines, branches, functions and statements. The windows
project is the iOS engine told it is Windows: `@expo/ui` and the other
modules with no Windows implementation are forbidden there, and the XAML
islands render as host views whose props are the payload the C++ side
receives. `bun run test:coverage` writes a report to `test-report/` and
coverage to `coverage/`.

### The harness

```sh
bun run harness doctor
bun run harness -p web --url http://localhost:8085 open / screenshot home.png tree
```

One command drives the kit on web, Windows, Android and iOS: open a route,
press, type, screenshot, and read the accessibility tree a screen reader
reads. See [expo-vitest/HARNESS.md](expo-vitest/HARNESS.md).

### CI

- **CI** (`ci.yml`), on every push and pull request: typecheck, lint, the
  tests with coverage, the device suite against the example on web, a Metro
  export of the example for ios, android and web, and a web Storybook build
  after its stories pass as browser tests.
- **Windows** (`windows.yml`), on changes to the kit, the runtime or the
  example: `scripts/windows-ci.sh` end to end on the react-native-windows
  line the template ships, plus the newest preview, allowed to fail.
- **Storybook** (`storybook.yml`), on push to `master`: publishes the web
  Storybook to GitHub Pages.
- **Release** (`release.yml`), on a `v*` tag matching `package.json`:
  re-runs the checks, publishes to npm with provenance and creates a GitHub
  release.

## License

MIT

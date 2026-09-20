# Expo Interface

A UI kit for [Expo](https://expo.dev) where every component is the platform's
own control.

Write a screen once. It renders as SwiftUI on iOS, Jetpack Compose (Material 3)
on Android, real DOM elements on web, and WinUI 3 on Windows. One accent color
themes all four, and screens follow the system's light or dark scheme with no
per-platform styling.

```tsx
import {Button, FieldGroup, Screen, Switch} from 'expo-interface';

export default function Settings() {
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

| Platform | That screen is | Through |
| --- | --- | --- |
| iOS | A SwiftUI `Form` with a `Toggle` and a `Button` | [`@expo/ui/swift-ui`](https://docs.expo.dev/versions/v57.0.0/sdk/ui/) |
| Android | A Material 3 grouped list with a `Switch` and a `Button` | `@expo/ui/jetpack-compose` |
| Web | `<button>`, `<input>` and the rest, with CSS beside each component | react-native-web for layout |
| Windows | A Settings-style card with a `ToggleSwitch` and a `Button` | The kit's own WinUI library, on [expo-windows](https://github.com/kat-tax/expo-windows) |

See every component live in the
[Storybook](https://kat-tax.github.io/expo-interface/).

## Quick start

Requires Expo SDK 57 and Expo Router.

### 1. Install

```sh
npx expo install expo-interface @expo/ui @expo/material-symbols
```

The peer dependencies are standard Expo modules that most Expo Router apps
already have. If any are missing:

```sh
npx expo install expo-router expo-symbols expo-asset expo-image expo-constants expo-status-bar expo-system-ui expo-web-browser react-native-safe-area-context
```

### 2. Wrap the app

Use `AccentProvider` and the kit's `Stack` in the root layout. `seed` is any
hex color, and the default is `#007AFF`.

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

### 3. Web only: emit the palette

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

### 4. Android only: register XML assets

Jetpack Compose draws icons from XML vector drawables, which
`@expo/material-symbols` provides.

```js
// metro.config.js
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('xml');

module.exports = config;
```

### 5. Build screens

Use the screen at the top of this page, then run the app on two platforms and
compare. [Getting started](docs/getting-started.md) continues from here with
tabs, icons and troubleshooting.

### Windows

Add the platform with
[expo-windows](https://github.com/kat-tax/expo-windows#quick-start). The kit
needs no setup of its own there. See [Windows](docs/platforms/windows.md).

## Components

Everything is exported from `expo-interface`. Value controls are controlled:
pair `value` with `onValueChange`. Each link says what the component does, its
props, what each platform renders, and where the platforms differ.

| Group | Components |
| --- | --- |
| [Layout](docs/components/layout.md) | [`Screen`](docs/components/layout.md#screen), [`ScreenHeader`](docs/components/layout.md#screenheader), [`NativeHost`](docs/hosts.md), [`Surface`](docs/components/layout.md#surface), [`Card`](docs/components/layout.md#card), [`Toolbar`](docs/components/layout.md#toolbar), [`KeyboardBar`](docs/components/layout.md#keyboardbar), [`FieldGroup`](docs/components/layout.md#fieldgroup), [`ListItem`](docs/components/layout.md#listitem), [`Collapsible`](docs/components/layout.md#collapsible), [`Divider`](docs/components/layout.md#divider), [`EmptyState`](docs/components/layout.md#emptystate) |
| [Navigation](docs/components/navigation.md) | [`Stack`](docs/components/navigation.md#stack), [`Tabs`](docs/components/navigation.md#tabs), [`TabStack`](docs/components/navigation.md#tabstack), [`ConstrainedStackHeader`](docs/components/navigation.md#constrainedstackheader), [`TabView`](docs/components/navigation.md#tabview), [`Pager`](docs/components/navigation.md#pager), [`HeaderMenu`, `HeaderAction`, `HeaderActions`](docs/components/navigation.md#headermenu-headeraction-headeractions), [`ExternalLink`](docs/components/navigation.md#externallink), [`ShareLink`](docs/components/navigation.md#sharelink) |
| [Controls](docs/components/controls.md) | [`Button`](docs/components/controls.md#button), [`Fab`](docs/components/controls.md#fab), [`Chip`](docs/components/controls.md#chip), [`IconToggle`](docs/components/controls.md#icontoggle), [`Switch`](docs/components/controls.md#switch), [`Checkbox`](docs/components/controls.md#checkbox), [`TextField`](docs/components/controls.md#textfield), [`SearchField`](docs/components/controls.md#searchfield), [`Picker`](docs/components/controls.md#picker), [`SegmentedControl`](docs/components/controls.md#segmentedcontrol), [`Slider`](docs/components/controls.md#slider), [`Stepper`](docs/components/controls.md#stepper), [`DateTimePicker`](docs/components/controls.md#datetimepicker), [`ColorPicker`](docs/components/controls.md#colorpicker) |
| [Indicators](docs/components/indicators.md) | [`Progress`](docs/components/indicators.md#progress), [`Spinner`](docs/components/indicators.md#spinner), [`Gauge`](docs/components/indicators.md#gauge), [`Badge`](docs/components/indicators.md#badge), [`Avatar`](docs/components/indicators.md#avatar), [`Typography`](docs/components/indicators.md#typography) and its variants |
| [Overlays](docs/components/overlays.md) | [`Menu`](docs/components/overlays.md#menu), [`ContextMenu`](docs/components/overlays.md#contextmenu), [`PopupMenu`](docs/components/overlays.md#popupmenu), [`Popover`](docs/components/overlays.md#popover), [`Tooltip`](docs/components/overlays.md#tooltip), [`Alert`](docs/components/overlays.md#alert), [`Sheet`](docs/components/overlays.md#sheet), [`Toast`](docs/components/overlays.md#toast) |

## Features

| Feature | What it does | Guide |
| --- | --- | --- |
| One accent | `AccentProvider` takes one hex seed. It becomes the SwiftUI tint, a full Material 3 palette, CSS variables, and WinUI's accent brushes. | [Theming](docs/theming.md#accent) |
| Light and dark | Every component follows the system. `setColorScheme` forces one, and on web the choice survives a reload without a flash. | [Theming](docs/theming.md#color-scheme) |
| Color tokens | `theme.label`, `theme.background` and the rest resolve to values the OS keeps current, with no re-render. `useColor` and `usePalette` give plain strings. | [Theming](docs/theming.md#tokens) |
| Icons | One token names the icon in SF Symbols, Material Symbols and Segoe Fluent Icons. `fill: true` asks for the solid form. | [Icons](docs/icons.md) |
| Native hosts | `Screen native` hosts a whole screen. `NativeHost` hosts a group of controls beside a canvas or an editor. | [Native hosts](docs/hosts.md) |
| Navigation | `Stack`, `Tabs` and `TabStack` over Expo Router: the native stack and tab bar, a floating bar on web, a `NavigationView` on Windows. | [Navigation](docs/components/navigation.md) |
| Web platform primitives | Popovers, anchor positioning, `<dialog>`, `<select>` and `<datalist>` rather than portals and z-index, with the ARIA keyboard patterns. | [Web](docs/platforms/web.md) |
| Windows | WinUI 3 controls in XAML islands, content in the title bar, keyboard shortcuts, high contrast, right to left and scaling. | [Windows](docs/platforms/windows.md) |
| `@expo/ui` on Windows | Screens written against `@expo/ui` and the community controls draw WinUI controls with no change. | [Windows](docs/platforms/windows.md#standing-in-for-expoui) |
| Accessibility | An accessible name on every control, headings, live regions, and the platform's own semantics. | [Accessibility](docs/accessibility.md) |
| Honest differences | A prop a platform cannot honour is documented as absent there. Nothing is faked. | [Where platforms differ](docs/platform-differences.md) |

## Documentation

| Page | What is in it |
| --- | --- |
| [Getting started](docs/getting-started.md) | The quick start in full, tabs, icons, troubleshooting. |
| [Components](docs/components/README.md) | Every component, one line each, linked to its entry. |
| [Theming](docs/theming.md) | Accent, scheme, tokens, reading colors, high contrast, constants. |
| [Icons](docs/icons.md) | Tokens, filled icons, drawables, the web font, Windows glyphs. |
| [Native hosts](docs/hosts.md) | Where native controls live on iOS and Android. |
| [Web](docs/platforms/web.md) and [Windows](docs/platforms/windows.md) | What each platform does its own way. |
| [Where platforms differ](docs/platform-differences.md) | The differences that change what a screen can do, in one table. |
| [Accessibility](docs/accessibility.md) | What the kit sets on each platform. |
| [Contributing](docs/contributing.md) | The repository, the checks, Storybook, the harness, CI. |

## Versions

Expo SDK 57, React Native 0.86.3 and `@expo/ui` 57.0.18. On Windows the kit
runs on [expo-windows](https://github.com/kat-tax/expo-windows). React Native
0.86 has no react-native-windows release yet, so the Windows side is built and
tested on the 0.84 line.
[expo-windows' versions page](https://github.com/kat-tax/expo-windows/blob/master/docs/versions.md)
says what that means for an app today.

## Contributing

The [example](./example) app, dropfiles, uses every component and imports the
package from `../src`.

```sh
bun install        # bun 1.4 or later
bun run web        # or ios, android
bun run lint
bun run typecheck
bun run test       # vitest, every platform project, 100% coverage
```

[Contributing](docs/contributing.md) has the rest: how a component is built,
the Storybooks, the tests, the harness and the Windows build.

## License

MIT

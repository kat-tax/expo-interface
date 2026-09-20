# Getting started

[Docs home](README.md)

This page takes an Expo Router app on Expo SDK 57 and puts a native screen in
it. It takes about ten minutes.

## 1. Install

```sh
npx expo install expo-interface @expo/ui @expo/material-symbols
```

The kit's peer dependencies are standard Expo modules that most Expo Router
apps already have. If any are missing:

```sh
npx expo install expo-router expo-symbols expo-asset expo-image expo-constants expo-status-bar expo-system-ui expo-web-browser react-native-safe-area-context
```

The kit itself has no native code on iOS or Android. Its controls come from
`@expo/ui`, which Expo lists as included in Expo Go. An app with native
dependencies of its own runs as a development build, as usual:

```sh
npx expo run:ios
npx expo run:android
```

## 2. Wrap the app

Wrap the app in `AccentProvider` and use the kit's `Stack` in the root layout.
`seed` is any hex color, and the default is `#007AFF`.

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

`Navigation` is a component of its own so that `useNavTheme()` reads the seed
from the provider above it.

The kit's `Stack` is Expo Router's native stack on iOS, Android and web. On
Windows, where there is no native stack, it is a stack of the kit's own with
the same API. Using it everywhere is what makes the app ready for Windows.

## 3. Web: emit the palette

On web, emit the palette as CSS variables in the root HTML, with the boot
script that applies a scheme the user forced before the bundle runs. This is
what keeps a static export from flashing the wrong scheme.

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

Skip this step if the app has no web target.

## 4. Android: register XML assets

On Android, Jetpack Compose draws icons from XML vector drawables, which
`@expo/material-symbols` provides. Register the extension in
`metro.config.js`:

```js
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('xml');

module.exports = config;
```

An app that applies `expo-windows`' `withWindows` has this already.

## 5. Build a screen

```tsx
// app/index.tsx
import {useState} from 'react';
import {Button, FieldGroup, Screen, Switch, TextField} from 'expo-interface';

export default function Home() {
  const [name, setName] = useState('');
  const [sync, setSync] = useState(true);
  return (
    <Screen native>
      <FieldGroup>
        <FieldGroup.Section title="Profile" footer="Shown to people you share with.">
          <TextField placeholder="Name" value={name} onChangeText={setName}/>
        </FieldGroup.Section>
        <FieldGroup.Section title="Sync">
          <Switch label="Notifications" value={sync} onValueChange={setSync}/>
          <Button label="Continue" onPress={() => {}}/>
        </FieldGroup.Section>
      </FieldGroup>
    </Screen>
  );
}
```

Run it on two platforms and compare. The same file is a SwiftUI `Form` on iOS,
a Material 3 grouped list on Android, DOM elements on web and WinUI controls on
Windows.

Three things to notice:

- **`Screen native`** mounts one native host around the whole screen. On iOS
  and Android, native controls live inside a host. [Native hosts](hosts.md)
  explains when a screen needs a smaller one instead.
- **Value controls are controlled.** `value` pairs with `onValueChange`.
- **There are no styles.** The platform's control brings its own look, and the
  accent and the light or dark scheme reach it through the providers.

## 6. Add tabs

```tsx
// app/(tabs)/_layout.tsx
import {type TabRoute, Tabs} from 'expo-interface';

const routes: TabRoute[] = [
  {name: 'index', href: '/', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
  {name: 'settings', href: '/settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
];

export default function TabsLayout() {
  return <Tabs routes={routes}/>;
}
```

`Tabs` is the platform's own tab bar on iOS and Android, a floating bar along
the top on web, and a WinUI `NavigationView` on Windows.
[Navigation](components/navigation.md#tabs) has its options.

Give a tab a header with `TabStack`:

```tsx
// app/(tabs)/settings/_layout.tsx
import {TabStack} from 'expo-interface';

export default function SettingsLayout() {
  return <TabStack title="Settings"/>;
}
```

## 7. Add icons

An icon prop takes a token that names the same icon in each platform's family:

```ts
// icons.ts
import {icon} from 'expo-interface';

export const share = icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'});
```

```tsx
<Button label="Share" prefixIcon={share} onPress={onShare}/>
```

Android needs a drawable beside the name. [Icons](icons.md) shows how to set
that up once, and how filled icons work.

## Windows

The kit draws WinUI 3 controls on Windows in an app built with
[expo-windows](https://github.com/kat-tax/expo-windows). Follow
[its quick start](https://github.com/kat-tax/expo-windows#quick-start) to add
the platform. The kit needs no setup of its own there: its native library is
autolinked, and it answers for `@expo/ui` through aliases the runtime finds.
Use `expo-windows` 0.25.0 or later.

[Windows](platforms/windows.md) covers the title bar, keyboard shortcuts and
what is different at a desk.

## Optional: a bar that follows the keyboard

`KeyboardBar` uses `react-native-keyboard-controller` on iOS and Android when
it is installed:

```sh
npx expo install react-native-keyboard-controller
```

## Next steps

- Browse [every component](components/README.md), or see them live in the
  [Storybook](https://kat-tax.github.io/expo-interface/).
- Set the accent, force a scheme and read colors in [Theming](theming.md).
- Check [Where platforms differ](platform-differences.md) before you rely on a
  prop everywhere.
- Look at the [example app](../example), which uses every component.

## Troubleshooting

**A native control does not appear on iOS or Android.** It is outside a host.
Put it under `<Screen native>` or wrap the group in `NativeHost`. See
[Native hosts](hosts.md).

**The app crashes at render with `Symbol.for is not a function`.** Something
at module scope is named `Symbol`, which shadows the global the React Compiler
uses. Rename the import or the declaration.

**An icon draws nothing on Android.** The token has no drawable. See
[Icons](icons.md).

**An icon draws nothing on Windows.** The Material name has no Segoe Fluent
twin yet. Give the token its own code point with `windows: 'E72D'`. See
[Windows glyphs](icons.md#windows-glyphs).

**A filled icon draws as an outline on web.** The variable Material Symbols
font is not registered. See [Filled icons](icons.md#filled-icons).

**The web build flashes the wrong scheme on load.** `app/+html.tsx` is missing
`getThemeCSS()` or `getThemeBootScript()`.

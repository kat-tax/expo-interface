# expo-windows

Windows for Expo apps, on react-native-windows. Expo's own tooling has no
`windows` platform: `expo prebuild` writes no `windows/` folder, `expo run`
has no Windows target, and the Expo packages find no native module there.
This package is the runtime that fills those in — three pieces, none of which
draws anything (the UI is [expo-interface](../README.md)'s job):

1. **Metro.** `withWindows(config)` in `metro.config.js` makes `expo start`
   serve a `windows` bundle: the platform is added, `react-native` resolves
   to `react-native-windows` for it, the packages with no Windows
   implementation resolve to thin stand-ins, and the runtime's install runs
   before the app's entry.
2. **Expo Modules Core.** The install puts Expo Modules Core's JavaScript
   global in place (the one web uses) and registers a Windows module under
   every name an Expo package asks `requireNativeModule` for: `ExpoLinking`,
   `ExponentConstants`, `ExpoAsset`, `ExpoFontLoader`, `ExpoWebBrowser`,
   `ExpoSystemUI`, `ExpoKeepAwake`, `ExpoClipboard`, `ExpoSharing`,
   `ExpoDevice`. Each is JavaScript over React Native's own APIs today; the
   ones that need the platform (fonts, sharing, the window background) grow
   a C++ TurboModule in a later release.
3. **The scaffold.** The `expo-windows` CLI writes `windows/` with
   react-native-windows' `cpp-app` template and patches it to run as an Expo
   app, builds and launches it, and writes the release bundle.

Verified in the kit's harness — an Expo 57 app on react-native-windows 0.84,
since no react-native-windows pairs with Expo 57's React Native yet: Expo
Router pushes and pops screens under the kit's drawn header, `expo-constants`
carries the app's name and scheme, `expo-linking` builds URLs from it, and
the kit's controls draw as XAML islands.

## Setup

```sh
npx expo install expo-windows react-native-windows   # the react-native-windows that matches your react-native
```

```js
// metro.config.js
const {getDefaultConfig} = require('expo/metro-config');
const {withWindows} = require('expo-windows/metro');

module.exports = withWindows(getDefaultConfig(__dirname));
```

```sh
npx expo-windows init     # writes windows/ from the cpp-app template and patches it
npx expo-windows run      # expo start + run-windows
npx expo-windows bundle   # the release JavaScript, for the release build
```

The machine needs what react-native-windows needs: Visual Studio 2022 with
the C++ desktop workload and the Windows 11 SDK (`rnw-dependencies.ps1`).

Two things an app carries itself. `react-native-screens` ships a Windows
project from the Paper days that does not build in a New Architecture app,
and Windows does not use its native views (Expo Router's screens are plain
views; the kit's `Stack` draws its own header), so the app's
`react-native.config.js` keeps it out of autolinking:

```js
// react-native.config.js
module.exports = {
  dependencies: {
    'react-native-screens': {platforms: {windows: null}},
  },
};
```

And a build that has been autolinked by hand passes
`-p:RunAutolinkCheck=false` to MSBuild, or the check re-adds what the config
excludes.

## What an app gets

| Package | On Windows |
| --- | --- |
| `expo-router` | Runs: routing, links, params, layouts. Its native stack is drawn by the kit's `Stack`. |
| `expo-linking` | The launch URL and incoming URLs from protocol activation, `openURL` through the shell. |
| `expo-constants` | `expoConfig` from the project's public config, embedded at bundle time. |
| `expo-asset` | The asset's URL as its local URI (Metro in development, the package in release). |
| `expo-font` | Families are recorded as loaded; the system font draws until the native loader lands. |
| `expo-web-browser` | The default browser; an auth session completes on activation with the redirect URL. |
| `expo-clipboard` | Text, over react-native-windows' clipboard. URLs and images report unavailable. |
| `expo-system-ui`, `expo-keep-awake`, `expo-status-bar`, `expo-splash-screen` | Accepted, without effect. |
| `expo-sharing`, `expo-device` | Sharing reports unavailable; the device is a desktop running Windows. |
| `expo-image`, `expo-glass-effect`, `expo-symbols` | Resolved to stand-ins: React Native's `Image`, a plain view, nothing. |

What has no Windows implementation and is not listed — `@expo/ui`, and any
package whose module calls `requireNativeModule` at import — still throws at
import. Keep it out of the Windows bundle with a `.windows.tsx` file or a
`Platform` check.

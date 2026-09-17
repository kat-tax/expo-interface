# expo-windows

Windows for Expo apps, on react-native-windows. Expo's own tooling has no
`windows` platform: `expo prebuild` writes no `windows/` folder, `expo run`
has no Windows target, and the Expo packages find no native module there.
This package is the runtime that fills those in — four pieces, none of which
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
   `ExpoDevice` — and `ExpoWindows`, the runtime's own, for the window.
3. **The Windows library.** `windows/ExpoWindows`, a C++/WinRT library
   autolinked into the app like any react-native-windows module, with the
   TurboModules the JavaScript modules call for what needs the platform: the
   window's title, the device, the clipboard (with change events), the share
   sheet, deep links, fonts. Without it in the app — the JavaScript alone —
   every module still answers, with what React Native gives it.
4. **The scaffold.** The `expo-windows` CLI writes `windows/` with
   react-native-windows' `cpp-app` template and patches it to run as an Expo
   app — the root component Expo registers, an unpackaged app that bootstraps
   the Windows App Runtime, one instance per app for deep links — builds and
   launches it, and writes the release bundle.

Verified in the kit's harness — an Expo 57 app on react-native-windows 0.84,
since no react-native-windows pairs with Expo 57's React Native yet: Expo
Router pushes and pops screens under the kit's drawn header, `expo-constants`
carries the app's name and scheme, `expo-linking` builds URLs from it, the
kit's controls draw as XAML islands, and the library's modules answer.

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

The library builds with the app: react-native-windows' autolinking finds it
through the package's `react-native.config.js`, as it finds the kit's. Two
things an app carries itself. `react-native-screens` ships a Windows project
from the Paper days that does not build in a New Architecture app, and
Windows does not use its native views (Expo Router's screens are plain views;
the kit's `Stack` draws its own header), so the app's `react-native.config.js`
keeps it out of autolinking:

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
| `expo-router` | Runs: routing, links, params, layouts. Its native stack is drawn by the kit's `Stack`, which names the window after the focused screen. |
| `expo-linking` | The app's scheme (`expo.scheme`) is registered as a URI protocol for the user at every launch; a link with it opens the app, or reaches the running one as the `url` event; `getInitialURL` is the launch link. `openURL` through the shell. |
| `expo-constants` | `expoConfig` from the project's public config, embedded at bundle time. |
| `expo-asset` | The asset's URL as its local URI (Metro in development, the package in release). |
| `expo-font` | The font file — fetched when Metro or a web host serves it — is registered with the process, under the family name inside the file: load it under that name. react-native-windows 0.84's text does not yet draw a font registered after launch (its DirectWrite fonts are resolved once), so until it does a family installed on the machine is what draws. |
| `expo-web-browser` | The default browser; an auth session completes on activation with the redirect URL. |
| `expo-clipboard` | Text (plain or HTML), links and images over the platform's clipboard, and `addClipboardListener` from its change event. |
| `expo-sharing` | The share sheet, with the file and `dialogTitle`. |
| `expo-device` | The machine's name, maker, model and SKU (`EasClientDeviceInformation`), the OS version and build, the memory, the processor, the uptime. |
| `expo-system-ui` | `setBackgroundColorAsync` paints the window itself — behind everything, and what shows while it resizes. |
| `expo-keep-awake`, `expo-status-bar`, `expo-splash-screen` | Accepted, without effect. |
| `expo-image`, `expo-glass-effect`, `expo-symbols` | Resolved to stand-ins: React Native's `Image`, a plain view, nothing. |

And the runtime's own `ExpoWindows` module, for any app that asks
`requireOptionalNativeModule('ExpoWindows')`: `setWindowTitle(title)`,
`getWindowTitleAsync()`, `setWindowChromeAsync({extend, theme})` (the content
into the title bar, the caption buttons drawn for the scheme),
`getTitleBarInsetsAsync()`, `setDragRegion(rect)` and
`setWindowBackground(color)` — what the kit's `useWindowChrome` and its
headers drive, and `expo-system-ui`'s background paints the window through.

What has no Windows implementation and is not listed — `@expo/ui`, and any
package whose module calls `requireNativeModule` at import — still throws at
import. Keep it out of the Windows bundle with a `.windows.tsx` file or a
`Platform` check.

## Deep links

`init` makes the app single-instance: a launch with a URL — a protocol
activation, or `app.exe scheme://path` — hands it to the running instance
and exits, and the running app receives it as React Native's `url` event,
which `expo-linking` and Expo Router listen to. The scheme's registration is
per user and needs no manifest, so it works for the unpackaged app the
scaffold builds; a packaged app declares the protocol in its manifest as
usual.

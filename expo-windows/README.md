# expo-windows

Windows for Expo apps, on react-native-windows. Expo's own tooling has no
`windows` platform: `expo prebuild` writes no `windows/` folder, `expo run`
has no Windows target, and the Expo packages find no native module there.
This package is the runtime that fills those in. It draws no UI; the controls
are [expo-interface](https://github.com/kat-tax/expo-interface)'s job.

| Piece | What it does |
| --- | --- |
| Metro config | `withWindows(config)` makes `expo start` and `expo export` serve a `windows` bundle. |
| The install | Runs before the app's entry and registers a Windows module under every name the Expo packages ask for, so every SDK 57 package imports. |
| The native library | `windows/ExpoWindows`, a C++/WinRT library autolinked into the app, with the modules and views that need the platform. |
| The CLI | `expo-windows init`, `run`, `bundle` and `package`: the app project written, built, bundled and shipped as an MSIX. |

[The expo-windows document](docs/expo-windows.md) is the full reference:
how each piece works, what every Expo package does on Windows, release builds,
packaging and signing, the window API, and the limits.

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
npx expo-windows init            # writes windows/ and patches it to run as an Expo app
npx expo-windows run             # expo start, then builds and launches the app
npx expo-windows run --release   # a Release build: the bundle inside, no server
npx expo-windows bundle          # the JavaScript and assets into windows/<App>/Bundle
npx expo-windows package --self-signed   # the app as an MSIX, signed for sideloading
```

The machine needs what react-native-windows needs: Visual Studio with the
C++ desktop workload and the Windows 11 SDK, PowerShell 7 and a .NET SDK on
the PATH. `expo-windows` must be among the app's dependencies so that
autolinking finds its library.

## Versions

react-native-windows ships one line per React Native minor, so the Expo SDK
decides the pairing. The runtime targets Expo SDK 57, whose React Native
(0.86) has no react-native-windows release yet; it is built and tested in a
react-native-windows 0.84 app with Expo 57's JavaScript, and CI smoke-runs
each new react-native-windows preview as it appears. An app on Expo 57
follows the matching release without changes to the runtime.

## What an app gets

Expo Router, linking with the app's scheme registered as a protocol,
constants, assets, fonts, the clipboard, sharing, the device, the battery,
the network, localization, Windows Hello, the secure store, cryptography,
files and the shell's pickers, images and the media library, video, audio
and speech, printing, the camera, maps, sensors and location, local
notifications, SQLite over the system's own, web views and DOM components
over WebView2. `@expo/ui` and the community controls are drawn by a UI kit
that contributes them, as `expo-interface` does with its WinUI islands. What
the platform has no counterpart for answers with the
package's own unavailability error rather than failing at import.

The runtime's own `ExpoWindows` module sets the window's title, extends the
content into the title bar, reads high contrast, drives the touch keyboard
and reports crashes.

[The document](docs/expo-windows.md#what-each-package-gets) has the
package-by-package table.

# expo-windows

`expo-windows` is the Windows platform for Expo apps. It runs an Expo app on
react-native-windows and gives the Expo SDK a Windows implementation.

Expo's own tooling has no `windows` platform: `expo prebuild` writes no
`windows/` folder, `expo run` has no Windows target, and the Expo packages
find no native module when they load. The runtime fills those gaps with four
pieces. None of them draws UI; the controls are
[expo-interface](expo-interface.md)'s job.

| Piece | What it does |
| --- | --- |
| Metro config | `withWindows(config)` makes `expo start` and `expo export` serve a `windows` bundle. |
| The install | A JavaScript module that runs before the app's entry and registers a Windows module under every name the Expo packages ask for. |
| The native library | `windows/ExpoWindows`, a C++/WinRT library autolinked into the app, with the native modules and views that need the platform. |
| The CLI | `expo-windows init`, `run`, `bundle` and `package`: the app project written, built, bundled and shipped. |

## Versions

react-native-windows ships one line per React Native minor. Expo pins React
Native, so the Expo SDK decides which react-native-windows an app can use.

| Expo SDK | React Native | react-native-windows |
| --- | --- | --- |
| 55 | 0.83 | 0.83 |
| 56 | 0.85 | 0.85 (preview) |
| 57 | 0.86 | no release yet |

The runtime targets Expo SDK 57. Its native library is built and tested in a
react-native-windows 0.84 app with Expo 57's JavaScript on React Native
pinned to that line, which is what `scripts/windows-ci.sh` builds on every
change. The CI workflow also builds the newest react-native-windows preview
and is allowed to fail there, so each new line is tried as it appears. An app
on Expo 57 with its own React Native 0.86 follows the matching
react-native-windows release without changes to the runtime.

Do not add `react-native-windows` as a dependency of `expo-windows` or of the
example app. The version an app needs is the one that matches its React
Native, and the app installs it.

The Windows App SDK version comes through react-native-windows (1.8 on the
0.84 line). Web content needs the WebView2 Runtime, which Windows 11 has.

## Setup

```sh
npx expo install expo-windows react-native-windows
```

Install the react-native-windows that matches the app's React Native.
`expo-windows` has to be a dependency of the app, not only installed, so
that autolinking finds its library.

```js
// metro.config.js
const {getDefaultConfig} = require('expo/metro-config');
const {withWindows} = require('expo-windows/metro');

module.exports = withWindows(getDefaultConfig(__dirname));
```

```sh
npx expo-windows init            # writes windows/ and patches it to run as an Expo app
npx expo-windows run             # expo start, then builds and launches the app
npx expo-windows run --release   # a Release build: the bundle inside, no server, no developer menu
npx expo-windows bundle          # the JavaScript and assets into windows/<App>/Bundle
npx expo-windows package         # the app as an MSIX
```

### What the machine needs

The requirements are react-native-windows' own:

- Visual Studio with the C++ desktop workload and the Windows 11 SDK.
  `rnw-dependencies.ps1` checks and installs them.
- PowerShell 7 (`pwsh`) and a .NET SDK on the PATH. The react-native-windows
  CLI loads its `init-windows` and `run-windows` commands through them, and
  without `pwsh` those commands are missing.

The 0.84 line of react-native-windows looks for Visual Studio 2026 before it
builds. With Visual Studio 2022, `init` still writes the project, and the
solution builds with MSBuild and the v143 toolset
(`-p:PlatformToolset=v143`, or `--toolset v143` on `package`).

### What `init` writes

`init` runs react-native-windows' `init-windows` with the `cpp-app` template
through the React Native community CLI, fetched on demand since an Expo app
does not carry it, then patches the result:

| File | Change |
| --- | --- |
| `windows/<App>/<App>.vcxproj` | `WindowsPackageType` is `None` and `WindowsAppSdkAutoInitialize` is `true`, so the unpackaged build bootstraps the Windows App Runtime itself. `BundleCliCommand` is `npx expo-windows bundle`, so a Release build bundles through Expo's exporter. |
| `windows/<App>/<App>.cpp` | The root component is the `main` component Expo registers. The app is single-instance, so a link opens in the running app. A smoke run mode for CI (below). |
| `windows/ExperimentalFeatures.props` | `UseFabric` is stated, and the Windows App SDK's transitive-dependency check is turned off. Every library project imports this file first. |
| `react-native.config.js` | Written when the app has none, with `react-native-screens` and `@react-native-community/netinfo` kept out of Windows autolinking. An existing file is left alone and named, so the exclusions can be added by hand. |
| `metro.config.js` | Kept as it was. `init-windows` writes react-native-windows' own config over the app's, and `init` puts the app's back, or writes one that applies `withWindows` when the app had none. |

The project name is the app's name in PascalCase with letters and digits
only: "Drop Files" becomes `DropFiles`, and a name that starts with a digit
gets an `App` prefix.

### Autolinking

The runtime's library and the kit's are found by react-native-windows'
autolinking through each package's `react-native.config.js` and built with
the app. Four things about other libraries:

- `react-native-screens` and `@react-native-community/netinfo` ship Windows
  projects from the Paper architecture that do not build in a New
  Architecture app. Windows does not use them: Expo Router's screens are
  plain views, the kit's `Stack` draws its own header, and the runtime
  answers netinfo's API from its own network library. The app's
  `react-native.config.js` keeps both out of autolinking:

  ```js
  module.exports = {
    dependencies: {
      'react-native-screens': {platforms: {windows: null}},
      '@react-native-community/netinfo': {platforms: {windows: null}},
    },
  };
  ```

- A build that was autolinked by hand passes `-p:RunAutolinkCheck=false` to
  MSBuild, or the check re-adds what the config excludes.
- `react-native-svg` and `@react-native-async-storage/async-storage` have
  library projects from react-native-windows' 0.7x line. They read
  `UseFabric` before 0.84 derives it from `RnwNewArch`, and one carries a
  `packages.config` that trips the Windows App SDK's transitive-dependency
  check. `init` handles both in `windows/ExperimentalFeatures.props`; a
  project written by hand needs the same two lines.
- `react-native-svg`'s project asks for the newest installed SDK where
  react-native-windows pins the app to 10.0.22621.0, so the app would drop the
  reference. `run` and `package` pass one `WindowsTargetPlatformVersion` to
  every project: 10.0.22621.0 when that SDK is installed, otherwise the newest
  one on the machine. A build by hand passes
  `-p:WindowsTargetPlatformVersion=<version>` the same way.

## How it works

### Metro

`withWindows(config)` changes the config for the `windows` platform only.
Other platforms are untouched.

- `windows` is added to the resolver's platforms, and `xml` to the asset
  extensions.
- `react-native` and `react-native/…` resolve to `react-native-windows`.
  This is what react-native-windows' own `react-native start` does and
  `expo start` does not.
- Packages with no Windows implementation resolve to the runtime's own files.
  The table is in `expo-windows/metro/index.js`: `expo-image`,
  `expo-glass-effect`, `expo-symbols`, `@react-native-community/netinfo`,
  `expo-blur`, `expo-mesh-gradient`, `@expo/dom-webview` and
  `react-native-webview`.
- A dependency of the app can contribute aliases of its own. It names a JSON
  table in its `package.json`, a module name to a file beside the table, and
  `withWindows` finds it by reading the app's dependencies, the way
  autolinking finds a native project. The runtime's own table wins over a
  contributed entry, and `withWindows(config, {aliases})` wins over both. A
  table that is named and cannot be read fails the config with the package's
  name.

  ```json
  "expo-windows": {"aliases": "./windows-aliases.json"}
  ```
- Four files inside packages are replaced: `expo`'s `fetch`, a native module
  elsewhere, is React Native's fetch on Windows; `expo-video`'s,
  `expo-camera`'s and `expo-maps`' native views are the runtime's islands.
- A file that exists only per platform, with no `windows` or `native`
  variant, resolves as `web`, the platform whose variant is the drawn one.
- The runtime's transformer wraps the app's Babel transformer and imports the
  install from the entry, and the serializer's run-before-main list runs it
  right after react-native-windows' `InitializeCore`. Expo's own preludes
  reach Expo Modules Core, which reads the `expo` global at import, so the
  install has to be first.
- The project's public app config is embedded for `expo-constants`, so
  `Constants.expoConfig` is there without a server. `withWindows(config,
  {appConfig: false})` leaves it out.
- Metro stays out of the `windows/` build folder.

### The install

`expo-windows/src/install.windows.ts` runs before the app's main module and
gives the Windows bundle what Expo's native platforms get from their host:
the `expo` global.

Expo Modules Core has two implementations of its entry points. The native one
expects the host to have installed `globalThis.expo`. The web one installs a
JavaScript version of the same global: `EventEmitter`, `NativeModule`,
`SharedObject` and a `modules` registry that `requireNativeModule` reads
first on every platform. Windows installs that version, then registers a
module under every name an SDK 57 package asks for. A module already
registered under a name is kept, so a second install changes nothing.

After the modules, the install sets a crash handler for fatal JavaScript
errors and registers the app's URL scheme as a protocol for the current user
when the native library is in the app.

Every SDK 57 package imports on Windows. A package that opens with
`requireNativeModule('Name')` throws at import when the name is missing, and
the app fails before its first render for a dependency it never calls. So a
package the runtime has no implementation for gets a module built from the
members its JavaScript reads, and each member answers when used: a method
throws the package's own `UnavailabilityError`, a permission is denied,
`isAvailableAsync` is `false`. That table (`src/modules/unavailable.ts`)
shrinks as modules become real.

### The native library

`windows/ExpoWindows` is a C++/WinRT library. It is autolinked into the app
like any react-native-windows module and holds the TurboModules the
JavaScript modules call for what needs the platform:

`ExpoWindowsWindow`, `ExpoWindowsDevice`, `ExpoWindowsClipboard`,
`ExpoWindowsSharing`, `ExpoWindowsLinking`, `ExpoWindowsFonts`,
`ExpoWindowsAccessibility`, `ExpoWindowsKeyboard`, `ExpoWindowsCrypto`,
`ExpoWindowsSecureStore`, `ExpoWindowsLocalization`, `ExpoWindowsNetwork`,
`ExpoWindowsFileSystem`, `ExpoWindowsImages`, `ExpoWindowsImageLoader`,
`ExpoWindowsMediaLibrary`, `ExpoWindowsMedia`, `ExpoWindowsPower`,
`ExpoWindowsLocalAuthentication`, `ExpoWindowsLocation`,
`ExpoWindowsSensors`, `ExpoWindowsNotifications`, `ExpoWindowsSQLite`,
`ExpoWindowsPrint`, `ExpoWindowsCamera` and `ExpoWindowsCrashes`.

It also holds five native views, hosted as XAML islands in Fabric component
views: the image view, the video view, the camera view, the map view and the
web view. Their specs are in `expo-windows/src/windows/specs/`.

Each JavaScript module asks for its TurboModule when it is used. Without the
library in the app, every module still answers with what React Native alone
gives it.

## Building and shipping

### Development

`expo-windows run` starts `expo start` and builds and launches the app with
react-native-windows' `run-windows`, passing the target SDK as an MSBuild
property. Arguments after `--` go to `run-windows`; `--no-packager` skips the
server; `--cli-version` pins the community CLI.

### Release builds

A Release build stands alone: the bundle is inside the app, there is no
server and no developer menu.

react-native-windows' Release configuration runs a bundle command before
compiling and then compiles the bundle to Hermes bytecode. The template's
command is the React Native CLI's, starting from an `index.js` an Expo app
does not have, so `init` points it at `expo-windows bundle`, which hands the
target's arguments to `expo export:embed`. The bundle, its assets and the
pages of the app's DOM components (`'use dom'`, under `www.bundle`) land in
`windows/<App>/Bundle`, and the app loads them from the `Bundle` folder next
to its exe. The app config is written into the bundle by the transformer, so
`Constants.expoConfig` is there without a server.

The bundle must be compiled by the Hermes in react-native-windows' NuGet
package, which the build does. A bundle compiled by the `hermesc` in
`node_modules` has a different bytecode version and loads as an empty window
with no error.

### The smoke run

`init` gives the app a smoke run mode for CI. Launched with
`EXPO_WINDOWS_SMOKE` naming a file, the app writes one line there once its
bundle has loaded and exits: `loaded <ms> <kb>` or `failed`. The two numbers
are the milliseconds from process start to the bundle's load and the working
set in kilobytes. `scripts/windows-ci.sh` holds them to budgets
(`SMOKE_MAX_MS`, 30 seconds by default, and `SMOKE_MAX_KB`, 1 GB), so a
regression in cold start or memory fails the build with a number.

### The Windows App Runtime

An unpackaged app bootstraps the Windows App Runtime at start, so the runtime
has to be installed on the machine. A machine that has only built the app
needs it: the MSIX packages come with the Windows App SDK the build restores
(`microsoft.windowsappsdk.runtime/<version>/tools/MSIX/win10-x64`, installed
in this order: the framework, `Main`, `Singleton`, `DDLM`), or Microsoft's
runtime installer does it. Without it the app aborts on start with
`Microsoft.UI.Dispatching.DispatcherQueueController` not registered.

A packaged app declares the runtime as a dependency and Windows installs it
with the app.

### Packaging

`expo-windows package` makes the app an MSIX without Visual Studio's
packaging project: a Release build (unless `--no-build`), its output copied
into a layout without the build's own files, a manifest written from the Expo
config, and `makeappx` from the Windows SDK, then `signtool`.

```sh
npx expo-windows package --self-signed                    # signed for sideloading; writes the .pfx and .cer next to the package
npx expo-windows package --cert app.pfx --password ...    # signed with your certificate
npx expo-windows package --no-build                       # the Release output as it is
npx expo-windows package --cert app.pfx --password ... --appinstaller https://downloads.example.com/app
```

The package lands at `windows/AppPackages/<Name>/<Name>_<version>_x64.msix`.
The exe inside is the same one an unpackaged install runs: its components
load by name from beside it, and the App Runtime's bootstrapper and the
runtime's own protocol registration both stand down under package identity,
which the manifest covers.

The manifest takes the name, `version` (padded to four parts), `scheme` (as a
protocol) and `icon` (rendered to the tile sizes) from the Expo config.
`expo.icon` has to be a PNG. The rest comes from `extra.windows`:

```json
"extra": {"windows": {
  "packageName": "Contoso.DropFiles",
  "publisher": "CN=Contoso",
  "publisherDisplayName": "Contoso",
  "version": "1.2.3.0",
  "capabilities": ["webcam", "microphone", "location"],
  "language": "en-US",
  "runtime": "1.8"
}}
```

`publisher` must match the signing certificate's subject. `runtime` is the
Windows App Runtime the package depends on.

Signing, from least to most trusted:

| How | Installs where |
| --- | --- |
| Unsigned | Machines with Developer Mode on, with `Add-AppxPackage -AllowUnsigned`. |
| `--self-signed` | Machines that import the `.cer` into the Trusted People store. This takes an administrator; a user-level import is not enough. |
| `--cert` with a certificate from a public CA | Any machine. `signtool sign /fd SHA256 /a` with the certificate in the store works too. |
| Azure Trusted Signing | Any machine. Its `signtool` dlib signs the `.msix` that `package` wrote. |
| The Microsoft Store | The Store takes the unsigned `.msix` and signs it. |

A `winget` manifest can point at the `.msix` URL once it is signed.

`--appinstaller <url>` writes `<Name>.appinstaller` next to the package.
Serve both files from that URL. Windows installs from the `.appinstaller`
(a link, or `Add-AppxPackage -AppInstallerFile`) and from then on checks the
URL for a newer package at every launch and in the background. A new build
published there is the update. `expo-updates` stays off on Windows; the
package is the update.

## Deep links

`init` makes the app single-instance. A launch with a URL, whether a protocol
activation or `app.exe scheme://path`, hands the URL to the running instance
and exits. The running app receives it as React Native's `url` event, which
`expo-linking` and Expo Router listen to, and `getInitialURL` answers the
launch link.

The install registers the app's scheme (`expo.scheme`) as a URI protocol for
the current user at every launch, when the native library is in the app. That
registration needs no manifest, so it works for the unpackaged app the
scaffold builds. A packaged app declares the protocol in its manifest, which
`package` writes.

## The window

`ExpoWindows` is the runtime's own module, for any app that asks
`requireOptionalNativeModule('ExpoWindows')`. The kit's `Stack`,
`useWindowChrome`, `useHighContrast` and `KeyboardBar` are built on it.
Nothing happens without the runtime's library in the app.

| Call | What it does |
| --- | --- |
| `setWindowTitle(title)`, `getWindowTitleAsync()` | The window's title. The kit's stack keeps it at the focused screen's ("Settings – My App"). |
| `setWindowChromeAsync({extend, theme})` | Extends the content into the title bar, with the caption buttons drawn for the scheme over the app's own top row, or takes it back. Resolves `false` where the title bar cannot be customized. |
| `getTitleBarInsetsAsync()` | The room the caption buttons take: `left`, `right`, `height`. |
| `setDragRegion({x, y, width, height})` | The rectangle, in points from the window's top left, that drags the window while the content is in the title bar. |
| `setWindowBackground(color)` | The window's own background, behind everything, and what shows while it resizes. `null` restores the system's. `expo-system-ui`'s `setBackgroundColorAsync` goes through this. |
| `getHighContrastAsync()`, `addHighContrastListener(listener)` | Whether a high contrast theme is on, its name, and the system's colours for the window's parts: `background`, `text`, `highlight`, `highlightText`, `buttonFace`, `buttonText`, `link`, `disabledText`. The listener hears the user turning it on or off. |
| `showTouchKeyboardAsync()`, `hideTouchKeyboardAsync()`, `getTouchKeyboardAsync()` | The touch keyboard. The system shows it only while a text control has focus, and keeps one the user brought up from the taskbar. |
| `getLastCrashAsync()`, `clearCrashesAsync()` | What the app left behind when it last died, or `null`. |

The touch keyboard's showing and hiding reach React Native's `Keyboard` as
`keyboardDidShow` and `keyboardDidHide`, with the rectangle it covers,
whoever brought it up. `Keyboard.addListener` therefore works on Windows.

### Crash reports

A native unhandled exception writes a minidump and a JSON report under
`crashes` in the app's local data (`%LOCALAPPDATA%\<app>\crashes`) before the
process goes down as it would have. A fatal JavaScript error is recorded
there by the install's global error handler, with its message and stack,
before React Native's own handler runs. The report says which (`type`), when
(`timestamp`) and what (`message`, with `stack` for a JavaScript error and
`code` plus the `dump` path for a native fault). An app reads it at the next
launch and sends it to its own crash service. The minidump opens in Visual
Studio or WinDbg.

## What each package gets

Every SDK 57 package imports. The tables say what each does on Windows and
what it does not.

### App, navigation and system

| Package | On Windows |
| --- | --- |
| `expo-router` | Routing, links, params and layouts. The native stack is drawn by the kit's `Stack`, which names the window after the focused screen. |
| `expo-linking` | The scheme registered as a protocol at every launch. A link opens the app or reaches the running one as the `url` event. `getInitialURL` is the launch link. `openURL` goes through the shell. |
| `expo-constants` | `expoConfig` from the project's public config, embedded at bundle time. |
| `expo-asset` | The asset's URL as its local URI: Metro's in development, the package's in release. |
| `expo-font` | The font file is fetched and registered with the process under the family name inside the file, so load it under that name. react-native-windows 0.84 resolves its DirectWrite fonts once, so text does not yet draw a font registered after launch. Until it does, a family installed on the machine is what draws. |
| `expo-application` | The app's name and version from the embedded config. An unpackaged app has no package identity, so `applicationId` is `null`, and the install time and platform ids are unavailable. |
| `expo-updates` | Not enabled: the bundle is the one built into the app, or Metro's. `reloadAsync` reloads the bundle the way the developer menu does. |
| `expo-system-ui` | `setBackgroundColorAsync` paints the window itself. |
| `expo-status-bar`, `expo-splash-screen` | Accepted, without effect. |
| `expo-keep-awake` | The display and the system kept awake while any tag is active. A tag's listeners hear `RELEASE` when it is deactivated. |
| `expo-screen-orientation` | A window's orientation is its shape: landscape when wider than tall. The locks that constrain nothing (`DEFAULT`, `ALL`) are supported; any other is refused with the package's error code. |
| `expo-web-browser` | The default browser. An auth session completes on activation with the redirect URL. |
| `expo-mail-composer` | The default mail client on a `mailto:` link with the recipients, copies, subject and body. The outcome is `undetermined`. |
| `expo-sharing` | The share sheet, with the file and `dialogTitle`. |
| `expo-clipboard` | Text (plain or HTML), links and images over the platform's clipboard, and `addClipboardListener` from its change event. |
| `expo-haptics` | Every call completes without effect. |
| `expo-blob` | `Blob` with its bytes in JavaScript: strings as UTF-8 (line endings made Windows' own with `endings: 'native'`), buffers and views copied, `slice`, `bytes`, `text`, `stream` and `arrayBuffer`. |

### Device

| Package | On Windows |
| --- | --- |
| `expo-device` | The machine's name, maker, model and SKU, the OS version and build, the memory, the processor and the uptime. |
| `expo-battery` | The charge, the state and the energy saver (the package's low power mode), with the three events. A machine without a battery reports none, as the web does. A battery plugged in below full is `NOT_CHARGING`. Battery optimization is Android's. |
| `expo-network` | The internet connection profile's kind (Wi-Fi, ethernet, cellular, VPN), whether it connects and reaches the internet, the IPv4 address of its adapter, and `addNetworkStateListener` from the system's status event. Airplane mode is Android's. |
| `expo-localization` | The user's languages in the order of their settings and the home region, each with its separators, currency, reading direction, measurement system and temperature unit; the calendar, the clock, the first weekday and the IANA time zone. Read at every call; Windows raises no event for a change. |
| `expo-local-authentication` | Windows Hello through `UserConsentVerifier` for the app's window. `authenticateAsync` shows the prompt with the message and answers `user_cancel`, `not_enrolled`, `not_available`, `lockout` or `unable_to_process` short of success. Windows Hello does not say which of a face, a fingerprint or a PIN is set up, so both biometric types are listed and the enrolled level is `SECRET`. A PIN-only setup may refuse the prompt with "not in the correct state", which reaches the app as `unknown`. |
| `expo-secure-store` | Each value encrypted for the current Windows user with DPAPI and kept as a file under the app's local data (`SecureStore\<keychainService>`). `requireAuthentication` asks Windows Hello before the asynchronous calls; the synchronous ones cannot wait for it. `canUseBiometricAuthentication` says whether Windows Hello is set up. |
| `expo-crypto` | Digests (MD5, SHA-1, SHA-256, SHA-384, SHA-512), random bytes and UUIDs from the system's cryptography, and AES-GCM over `CryptographicEngine` with tags of 12 to 16 bytes. MD2 and MD4 are Apple's. |
| `expo-screen-capture` | `preventScreenCaptureAsync` keeps the window out of captures and recordings (a capture shows black where it is) and `allowScreenCaptureAsync` lets it back in. Windows raises no event for a screenshot, so the detection permission is denied and the listener is never called. |
| `expo-sensors` | Each sensor the machine has, from `Windows.Devices.Sensors`: accelerometer, gyroscope, magnetometer (calibrated and not), barometer, light sensor, pedometer (with `getStepCountAsync` from the system's history), and device motion assembled from the accelerometer, the gyroscope and the inclinometer. Most desktops have none, and `isAvailableAsync` says so. The permissions are granted, since Windows gates no sensor. |
| `expo-location` | The geolocator: the foreground permission as the system grants the app's use of location (Windows asks in Settings, not in the app), `hasServicesEnabledAsync`, `getCurrentPositionAsync` at the accuracy asked, `getLastKnownPositionAsync`, `watchPositionAsync` over the geolocator's position events, and headings from the compass where the machine has one. Background updates, motion activity, geocoding and geofencing are other platforms' and throw the package's own error. |
| `expo-notifications` | Local notifications through the Windows App SDK's app notification manager: `scheduleNotificationAsync` with every trigger the package has, each waiting in JavaScript for its moment, then shown as a toast; `getPresentedNotificationsAsync` and dismissals from the notification center; a click on a toast as the response and the last response, whether the app was running or was launched by it; the permission as the manager's setting (the user turns notifications on in Settings). A schedule lives as long as the app does, since an unpackaged app has no system scheduler. The taskbar badge is refused for an unpackaged app. Channels, categories' buttons, the handler, push tokens and background tasks are other platforms'. |

### Files and media

| Package | On Windows |
| --- | --- |
| `expo-file-system` | `File` and `Directory` over the app's folders: `Paths.cache` and `Paths.document` under `%LOCALAPPDATA%\<app>`, `Paths.bundle` beside the exe. Reads, writes, `info`, `md5`, `copy`, `move`, `list`, `FileHandle` byte access, the disk sizes, downloads and uploads with progress, `pickFileAsync` and `pickDirectoryAsync` through the shell's pickers, and `Watcher` over directory change notifications. The legacy `expo-file-system/legacy` functions answer over the same library. Pausing a download is another platform's. |
| `expo-document-picker` | The shell's file picker for the app's window, filtered by the MIME types asked for, each pick copied into the cache. |
| `expo-image-picker` | The same picker filtered to images or videos, with sizes, MIME type, file size and `base64`; `launchCameraAsync` through the camera capture UI for a photo or a video. The permissions are granted. Editing and EXIF are accepted without effect. |
| `expo-image-manipulator` | Resize, crop, rotate (quarter turns) and flip through the system's codecs, and `saveAsync` as JPEG at the quality asked or PNG. WebP is decoded, not encoded. `extent` is web's. |
| `expo-media-library` | The user's Pictures, Videos and Music folders as the library, their folders as albums: listing with sorting, filtering and paging, asset info with the shell's image and video properties, creating and deleting assets and albums, moving assets between albums, and a change listener. Access is granted in full. Moments, favourites and album migration are other platforms'. |
| `expo-image` | `Image` and `ImageBackground` over the runtime's image island: the system's codecs (JPEG, PNG, GIF, BMP, TIFF, WebP and HEIF as the machine has them), SVG, and blurhash placeholders; every `contentFit` and `contentPosition`; `placeholder`, `transition`, `tintColor`, `blurRadius`; animated GIFs; `recyclingKey`; the load, progress, error and display events. Sources are `http(s)` URLs (with `headers`), `file:` URIs and paths, `data:` URIs and bundled assets. The disk cache under the app's local data is shared with `Image.prefetch` and the cache functions; the memory cache holds decoded pictures. `loadAsync`, `useImage` and `generateBlurhashAsync` work. A thumbhash is not decoded or made, SF Symbols are iOS's, and `priority`, `allowDownscaling`, `responsivePolicy`, `decodeFormat` and live text are taken without effect. |
| `expo-video` | `VideoPlayer` over the runtime's media engine: play, pause, seek, replay, loop, volume, mute, rate, the status and time events, `replace`, `generateThumbnailsAsync`, and the shell's transport controls. `VideoView` is a WinUI `MediaPlayerElement` island with the system's controls, `contentFit` and fullscreen. Picture in picture, caching, subtitle, audio and video tracks and external playback are other platforms'. |
| `expo-audio` | `AudioPlayer` over the same engine, `AudioRecorder` over `MediaCapture` into the app's cache or documents (m4a, mp3, wav, wma by extension, with the inputs listed and chosen), `AudioPlaylist` over one player at a time, and the lock-screen calls through the shell's transport controls. The recording permission is granted; a refused capture fails at `prepareToRecordAsync`. The audio mode, sampling and `AudioStream` are other platforms'. |
| `expo-speech` | The system's voices with `voice`, `language`, `pitch`, `rate` and `volume`, one utterance after another, with the start, done, stopped and error callbacks, `stop`, `pause`, `resume`, `isSpeakingAsync` and `getAvailableVoicesAsync`. The word boundary is another platform's. |
| `expo-video-thumbnails` | A frame the engine renders at the time asked, as JPEG or PNG, into the cache. A remote video is fetched first. |
| `expo-print` | `printToFileAsync` writes the page (HTML, or a file or web URI) as a PDF through WebView2, sized in points and oriented as asked, with the page count and the bytes in base64 when asked. `printAsync` hands it to the system's print dialog. Margins, the markup formatter and a printer chosen ahead are iOS's. |
| `expo-camera` | `CameraView` over a camera island on the panel asked: `takePictureAsync` as JPEG, `recordAsync` as MP4 with `maxDuration`, `stopRecording`, pausing and resuming the preview, the picture sizes, the torch and the zoom where the camera has them, and the ready and mount-error events. The camera and microphone permissions are the system's privacy settings. Barcode scanning, lenses, the picture reference and toggling a recording are other platforms'. |
| `expo-maps` | `GoogleMaps.View` and `AppleMaps.View` alike over a `MapControl` island: the camera position, markers and annotations with `onMarkerClick`, the zoom controls, `onMapLoaded`, and `setCameraPosition` on the ref. Tiles need an Azure Maps key in the app config's `extra.azureMapsKey`; without one the control says so itself. Shapes, POIs, street view and the user's location dot are other platforms'. |

### Storage

| Package | On Windows |
| --- | --- |
| `expo-sqlite` | The system's SQLite (`winsqlite3.dll`, in every Windows 10 and 11) under the package's `NativeDatabase` and `NativeStatement`: databases under the app's local data or in memory, statements bound (blobs both ways), run, stepped and read, transactions, serialize and deserialize, backup, delete, a bundled database imported from an asset, `addDatabaseChangeListener` from the update hook, and the key-value store and localStorage shim on top. Sessions and libSQL are other builds'. Extensions load where the system's SQLite allows it; none is bundled. |
| `@react-native-async-storage/async-storage` | Its own Windows port, an architecture-neutral C++ TurboModule, autolinked. Its database is under the app's local data (`AsyncStorage.db`), since an unpackaged app cannot ask `ApplicationData.Current`; an app that sets that core application property keeps its own. |

### UI and web content

| Package | On Windows |
| --- | --- |
| `@expo/ui`, its subpaths and the community controls | Drawn with controls, and the runtime has none. A UI kit answers for them through the aliases it contributes; `expo-interface` does, for every export. Without one they resolve to the packages themselves, which have no Windows implementation. |
| `expo-blur`, `expo-mesh-gradient` | Stand-ins that compose: `BlurView` is a tinted translucent surface at the intensity asked, `MeshGradientView` draws its colours as bands. |
| `expo-glass-effect`, `expo-symbols` | Stand-ins: a plain view, and nothing. |
| `@expo/dom-webview` | Expo's DOM components (`'use dom'`) render in a WinUI `WebView2` island. The page gets `window.ReactNativeWebView` before its own script, so marshalled props, native actions and `useDOMImperativeHandle` work as on iOS and Android. In development the page is Metro's; in a Release build each component's page is exported into `Bundle\www.bundle` and served at a virtual host (`https://expo-dom.bundle`), so it has a secure origin rather than a `file:` one. |
| `react-native-webview` | `WebView` over the same island: a page by URL or HTML (served at `baseUrl` so it has an origin), the injected scripts, `onMessage` and `postMessage` both ways, the load and navigation events, `reload`, `goBack`, `goForward`, `stopLoading`, and `webviewDebuggingEnabled` for the developer tools. The origin whitelist, the media policies and `onShouldStartLoadWithRequest` are accepted without effect. |
| `react-native-svg`, `@shopify/flash-list` | Their own Windows ports, autolinked: react-native-svg has a Fabric build, FlashList 2 is JavaScript. SVG shapes draw; SVG text did not in the runtime's test app. |
| `@react-native-community/netinfo` | `fetch`, `refresh`, `addEventListener`, `useNetInfo` and `useNetInfoInstance` over the runtime's network library. `configure`'s reachability settings are kept without effect. |

### Not on Windows

| Package | Why |
| --- | --- |
| `expo-task-manager`, `expo-background-fetch`, `expo-background-task` | An app runs while its window is open. Tasks can be defined, not registered; the manager is unavailable and the schedulers `Restricted`. |
| `expo-store-review`, `expo-sms`, `expo-cellular`, `expo-brightness`, `expo-tracking-transparency`, `expo-age-range` | The platform has no review prompt, messaging, carrier, brightness control, advertising id or age signal. Permissions are denied and guarded calls report unavailable. |
| `expo-calendar`, `expo-contacts` | Behind package identity, which an unpackaged app does not have. |
| `expo-eas-client`, `expo-app-metrics`, `expo-observe` | A client id for the launch, and records taken without being kept. |
| `expo-gl`, `expo-brownfield`, push tokens, background notification tasks | In the unavailable table: each method throws the package's own error. |

## Limits

- Text does not draw a font registered after launch on react-native-windows
  0.84. A family installed on the machine draws.
- There is no Mica or acrylic backdrop behind the content. A Win32 window on
  the Windows App SDK's composition islands has no backdrop target in this
  release.
- An unpackaged app has no package identity: no `applicationId`, no system
  notification scheduler, no taskbar badge, and no calendars or contacts.
- `expo-updates` is off. The package is the update.
- WebView2 allows one environment configuration per process. The runtime
  creates one the way WinUI does, so WinUI's own `WebView2` and `MapControl`
  keep working beside it.
- `useWindowDimensions` reports the window's physical size at a scale of 1
  and never updates on a resize. This is react-native-windows' behaviour;
  measure layouts with `onLayout` instead.

## Verification

- `bun run test` in `expo-windows/` runs the runtime's two Vitest projects:
  `expo-windows` (the JavaScript modules and aliases on the React Native
  engine, each SDK package imported with the install in place) and
  `expo-windows-node` (the Metro config and the CLI, against the small Expo
  project in `fixture/`). Coverage is 100% on lines, branches, functions and
  statements.
- `scripts/windows-ci.sh <workdir>` builds the example end to end on the line
  react-native-windows ships: a scratch Expo 57 app with React Native pinned
  to that line, this checkout's kit and runtime in its `node_modules`,
  `expo-windows init`, autolinking, the bundle, Debug and Release builds, the
  package, the Windows App Runtime, and a smoke launch that reports cold start
  and working set. The scratch app carries every SDK 57 package and a probe
  route that imports them all. The Windows workflow runs it on every change
  and keeps the app and the bundle as artifacts. `RN_VERSION` and
  `RNW_VERSION` together build another line.
- The `expo-vitest` harness drives a built app: `expo-harness -p windows
  --target <exe> open /route screenshot out.png tree`.

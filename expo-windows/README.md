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
   the Windows App Runtime, one instance per app for deep links, the
   properties the community's library projects read — builds and launches
   it, and writes the release bundle.

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
npx expo-windows init            # writes windows/ from the cpp-app template and patches it; keeps your metro.config.js
npx expo-windows run             # expo start + run-windows
npx expo-windows run --release   # a Release build: the bundle inside, no server, no developer menu
npx expo-windows bundle          # the JavaScript and assets into windows/<App>/Bundle by hand
```

A Release build stands alone. react-native-windows' Release configuration
runs a bundle command before compiling and then compiles the bundle to
Hermes bytecode; the template's command is the React Native CLI's, from an
`index.js` an Expo app does not have, so `init` points it at `expo-windows
bundle`, which hands the target's arguments to `expo export:embed`. The
bundle and its assets land in `windows/<App>/Bundle`, and the app loads
them from the `Bundle` folder next to its exe. The app config
(`Constants.expoConfig`) is written into the bundle by the runtime's
transformer, so it is there without a server, and the runtime's install
runs before Expo's own start-up modules whichever way the bundle is made.
`init` also gives the entry a smoke run: launched with `EXPO_WINDOWS_SMOKE`
naming a file, the app writes `loaded` or `failed` there once its bundle
has loaded and exits, which is how a CI job proves a Release build starts.

```sh
npx expo-windows package --self-signed          # windows/AppPackages/<Name>/<Name>_<version>_x64.msix, signed for sideloading
npx expo-windows package --cert app.pfx --password ...   # signed with your certificate (its subject is the Publisher)
npx expo-windows package --no-build              # the Release output as it is
```

`package` makes the app an MSIX without Visual Studio's packaging project:
a Release build, its output copied into a layout without the build's own
files, a manifest written from the Expo config (the name, `version` padded
to four parts, `scheme` as a protocol, `icon` rendered to the tile sizes)
and `makeappx` from the Windows SDK, then `signtool`. The package depends on
the Windows App Runtime framework package, and the exe is the same one an
unpackaged install runs: its components load by name from beside it, the
App Runtime's bootstrapper stands down under package identity, and so does
the runtime's own protocol registration, which the manifest covers. What
the package says beyond the config comes from `extra.windows`:

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

Windows installs a signed package whose certificate chains to a root the
machine trusts. A self-signed one (`--self-signed` writes the `.pfx` and a
`.cer` next to the package) is trusted by importing the `.cer` into the
machine's Trusted People store, which takes an administrator; a user-level
import is not enough. An unsigned package installs only with Developer Mode
on (`Add-AppxPackage -AllowUnsigned`). For distribution, sign with a
certificate from a public CA or through the Store, which signs itself.

```sh
npx expo-windows package --cert app.pfx --password ... --appinstaller https://downloads.example.com/app
```

`--appinstaller <url>` writes `<Name>.appinstaller` next to the package.
Serve both files from that URL: Windows installs from the `.appinstaller`
(a link, or `Add-AppxPackage -AppInstallerFile`) and from then on checks
the URL for a newer package at every launch and in the background, so a
new build published there is the update. `expo-updates` stays off on
Windows; the package is the update. The ways to sign, from least to most
trusted: a self-signed certificate (sideloading on machines that import
its `.cer`), a code-signing certificate from a public CA (`--cert`, or
`signtool sign /fd SHA256 /a` with the certificate in the store), Azure
Trusted Signing (its `signtool` dlib, on the `.msix` `package` wrote), or
the Microsoft Store, which takes the unsigned `.msix` and signs it. A
`winget` manifest can point at the `.msix` URL once it is signed.

The machine needs what react-native-windows needs: Visual Studio with the
C++ desktop workload and the Windows 11 SDK (`rnw-dependencies.ps1`), plus
PowerShell 7 (`pwsh`) and a .NET SDK on the PATH — react-native-windows'
own CLI loads its commands through them, and without `pwsh` the
`init-windows` and `run-windows` commands are simply not there. Its 0.84
line looks for Visual Studio 2026 (18.6) before it builds; with Visual
Studio 2022, `init` still writes the project, and the solution builds with
MSBuild and the v143 toolset (`-p:PlatformToolset=v143`), which is how it
was verified here. `expo-windows` must be among the app's dependencies for
autolinking to find its library, which `expo install` sees to.

The library builds with the app: react-native-windows' autolinking finds it
through the package's `react-native.config.js`, as it finds the kit's. Two
things an app carries itself. `react-native-screens` and
`@react-native-community/netinfo` ship Windows projects from the Paper days
that do not build in a New Architecture app, and Windows does not use them
(Expo Router's screens are plain views and the kit's `Stack` draws its own
header; the runtime answers netinfo's API from its own network library), so
the app's `react-native.config.js`, which `expo-windows init` writes, keeps
both out of autolinking:

```js
// react-native.config.js
module.exports = {
  dependencies: {
    'react-native-screens': {platforms: {windows: null}},
    '@react-native-community/netinfo': {platforms: {windows: null}},
  },
};
```

And a build that has been autolinked by hand passes
`-p:RunAutolinkCheck=false` to MSBuild, or the check re-adds what the config
excludes.

The library projects that do build — `react-native-svg`'s and
`@react-native-async-storage/async-storage`'s are from react-native-windows'
0.7x line — choose their New Architecture build by reading `UseFabric` at
their first line, before react-native-windows 0.84 derives it from
`RnwNewArch`, and one still carries a `packages.config` that trips the Windows
App SDK's transitive-dependency check, meant for packages.config projects
while every project here restores through PackageReference. `expo-windows
init` states `UseFabric` and turns that check off in the app's
`windows/ExperimentalFeatures.props`, which every library project imports
first; a project written by hand wants the same two lines. And
`react-native-svg`'s project asks for the latest SDK installed where
react-native-windows pins the app to 10.0.22621.0, so its metadata targets a
newer SDK than the app and the app drops the reference; `expo-windows run`
passes `WindowsTargetPlatformVersion=10.0.22621.0` to `run-windows` as an
MSBuild property (joined to a `--msbuildprops` of your own), and a build by
hand passes `-p:WindowsTargetPlatformVersion=10.0.22621.0`.

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
| `expo-status-bar`, `expo-splash-screen` | Accepted, without effect. |
| `expo-keep-awake` | The display and the system kept awake (the UI thread's execution state) while any tag is active; a tag's listeners hear `RELEASE` when it is deactivated. |
| `expo-battery` | The battery's charge, state and the energy saver (the package's low power mode) from `PowerManager`, and the three events from its; a machine without a battery reports none, as the web does. A battery plugged in below full is `NOT_CHARGING`, Android's word for it. Battery optimization is Android's. |
| `expo-screen-capture` | `preventScreenCaptureAsync` keeps the window out of screen captures and recordings (`WDA_EXCLUDEFROMCAPTURE`: a capture shows black where it is) and `allowScreenCaptureAsync` lets it back in. Windows raises no event for a screenshot, so the detection permission is denied and the listener never called; the app switcher protection is iOS's. |
| `expo-local-authentication` | Windows Hello through `UserConsentVerifier` for the app's window: there is hardware when the verifier is not "device not present", the user is enrolled when it is available, and `authenticateAsync` shows the Windows Hello prompt with the message and answers `user_cancel`, `not_enrolled`, `not_available`, `lockout` or `unable_to_process` short of success. Windows Hello does not say which of a face, a fingerprint or a PIN is set up, so both biometric types are listed and the enrolled level is `SECRET`. On the harness machine (a PIN-only Windows Hello) Windows refused the prompt with "not in the correct state", which reaches the app as `unknown` with the message; the secure store's `requireAuthentication` takes the same road. |
| `expo-sensors` | Each sensor as the machine has it, from `Windows.Devices.Sensors`: the accelerometer (g), the gyroscope (rad/s), the magnetometer (µT, calibrated and not), the barometer (hPa), the light sensor (lux), the pedometer (steps, and `getStepCountAsync` from the system's history), and device motion assembled from the accelerometer, the linear accelerometer, the gyroscope and the inclinometer (rotation in radians). Most desktops have none, and `isAvailableAsync` says so; the permissions are granted, since Windows gates no sensor. |
| `expo-location` | The geolocator: the foreground permission as the system grants the app's use of location (Windows asks in Settings, not the app; background and motion activity are other platforms', denied), `hasServicesEnabledAsync`, `getCurrentPositionAsync` at the accuracy asked, `getLastKnownPositionAsync` from the last position seen, `watchPositionAsync` over the geolocator's position events (with `Expo.locationError` when the service goes away), and headings from the compass where the machine has one. Geocoding, background updates and geofencing throw the package's own error. |
| `expo-notifications` | Local notifications through the Windows App SDK's app notification manager, which an unpackaged app registers with at startup (the exe's name and icon on the toast): `scheduleNotificationAsync` with the package's triggers (an interval, a date, daily, weekly, monthly, yearly, calendar), each waiting in JavaScript for its moment — a schedule lives as long as the app does, since an unpackaged app has no scheduler of the system's — then shown as a toast and told to the app; `getPresentedNotificationsAsync` and the dismissals from the notification center; a click on a toast, while the app runs or as the launch it caused, as the response and the last response; the taskbar badge as a count (which Windows refused for the unpackaged harness app, `setBadgeCountAsync` answering false); the permission as the manager's setting (the user turns notifications on in Settings, not in the app). Channels are Android's and empty, categories are kept without buttons on the toast, the handler has nothing to decide (a toast shows whether the app is in front or not), and push tokens and background tasks need a service and stay unavailable. |
| `expo-sqlite` | The system's SQLite (`winsqlite3.dll`, which every Windows 10 and 11 has: 3.43 on Windows 11 at the time of writing, 3.29 by the SDK's header) under the package's `NativeDatabase`, `NativeStatement` and the rest: databases in `SQLite` under the app's own local data (or `:memory:`), statements bound (blobs both ways), run, stepped and read, transactions, `serializeAsync` and `deserializeDatabaseAsync`, `backupDatabaseAsync`, `deleteDatabaseAsync`, a bundled database imported from an asset (a file copied, or Metro's URL downloaded in development), `addDatabaseChangeListener` from the update hook, and the key-value store and localStorage shim on top. Sessions and libSQL are other builds'; extensions load where the system's SQLite allows it; none is bundled. |
| `expo-print` | `printToFileAsync` writes the page — HTML, or a file or web URI — as a PDF into the cache through WebView2 behind the app's window, sized in points and oriented as asked, with the page count and the bytes in base64 when asked; `printAsync` hands it to the system's print dialog. Margins, the markup formatter and a printer chosen ahead are iOS's. |
| `expo-camera` | `CameraView` over a camera island — `MediaCapture` shown through a `MediaPlayerElement` — on the panel asked (front, back, or the first camera there is): `takePictureAsync` into the cache as JPEG (with `base64` when asked), `recordAsync` as MP4 (with `maxDuration`), `stopRecording`, `pausePreview` and `resumePreview`, `getAvailablePictureSizesAsync`, the torch and the zoom where the camera has them, `onCameraReady` and `onMountError`. The camera and microphone permissions are the system's privacy settings, read and asked for through `AppCapability`; `isAvailableAsync` says whether there is a camera. Barcode scanning, lenses, the picture reference and toggling a recording are other platforms'. |
| `expo-maps` | `GoogleMaps.View` and `AppleMaps.View` alike over a `MapControl` island (Windows App SDK 1.5+): the camera position, markers and annotations as icons with `onMarkerClick`, the zoom controls as the UI settings say, `onMapLoaded`, and `setCameraPosition` on the ref. The control shows tiles with an Azure Maps key, read from the app config's `extra.azureMapsKey`; without one it says so itself. Shapes, POIs, street view and the user's location dot are other platforms'; the permission is the location one. |
| `expo-image`, `expo-glass-effect`, `expo-symbols` | Resolved to stand-ins: React Native's `Image`, a plain view, nothing. |
| `@expo/ui` | Its universal layout primitives — `Host`, `Column`, `Row`, `Spacer`, `Text`, `List`, `ScrollView`, `RNHostView` — resolve to plain views laid out as they ask; its controls are the kit's on Windows. |
| `expo-application` | The app's name and version from the embedded config. An unpackaged app has no package identity, so `applicationId` is `null`; the install time and the platform ids the package reports unavailable. |
| `expo-updates` | Not enabled: the bundle is the one built into the app (or Metro's), so `expo-asset` and `expo-constants` stay on their embedded path. `reloadAsync` reloads the bundle the way the developer menu does. |
| `expo-mail-composer` | The default mail client, opened on a `mailto:` link through the shell with the recipients, copies, subject and body; the outcome is `undetermined`. |
| `expo-screen-orientation` | A window's orientation is its shape — landscape when wider than tall. The locks that constrain nothing (`DEFAULT`, `ALL`) are supported; any other is refused with the package's error code. |
| `expo-blob` | `Blob` with its bytes in JavaScript: strings as UTF-8 (line endings made Windows' own with `endings: 'native'`), buffers and views copied, `slice`, `bytes`, `text`, and the package's `stream` and `arrayBuffer` on top. |
| `expo-haptics` | Every call completes without effect. |
| `expo-task-manager`, `expo-background-fetch`, `expo-background-task` | Tasks can be defined, not registered: an app runs while its window is open. The manager is unavailable and the schedulers `Restricted`. |
| `expo-store-review`, `expo-sms`, `expo-cellular`, `expo-brightness`, `expo-tracking-transparency`, `expo-age-range`, `expo-calendar`, `expo-contacts` | What the platform has: no review prompt, no messaging, no carrier, no brightness, no advertising id, no age signal, and calendars and contacts behind package identity — permissions denied, and calls the packages guard themselves reported unavailable. |
| `expo-eas-client`, `expo-app-metrics`, `expo-observe` | A client id for the launch, and records taken without being kept. |
| `expo-crypto` | Digests (MD5, SHA-1, SHA-256, SHA-384, SHA-512), random bytes and UUIDs from the system's cryptography, and AES-GCM (`AESEncryptionKey`, `AESSealedData`, `aesEncryptAsync`, `aesDecryptAsync`) over `CryptographicEngine`; tags of 12 to 16 bytes. MD2 and MD4 are Apple's. |
| `expo-secure-store` | Each value encrypted for the current Windows user with DPAPI and kept as a file of the app's local data (`%LOCALAPPDATA%\<app>\SecureStore\<keychainService>`). `requireAuthentication` asks Windows Hello before the asynchronous calls (the synchronous ones cannot wait for it); `canUseBiometricAuthentication` says whether Windows Hello is set up. |
| `expo-localization` | The user's languages in the order of their settings and the home region, each with its separators, currency, reading direction, measurement system and temperature unit from the system's locale data; the calendar, the clock, the first weekday and the IANA time zone (through ICU). Read at every call; Windows raises no event for a change, so the hooks rerender on their own. |
| `expo-network` | The internet connection profile's kind (Wi-Fi, ethernet, cellular, VPN), whether it connects and reaches the internet, the IPv4 address of its adapter, and `addNetworkStateListener` from the system's status event. Airplane mode is Android's. |
| `@expo/dom-webview` | Expo's DOM components (`'use dom'`) render in a WinUI 3 `WebView2` hosted in a XAML island: the page gets `window.ReactNativeWebView` (`postMessage`, `injectedObjectJson`) before its own script, so marshalled props, native actions and `useDOMImperativeHandle` work as on iOS and Android. In development the page is Metro's; a production export of the DOM pages is not there yet. Needs the WebView2 Runtime, which Windows 11 has. |
| `react-native-webview` | `WebView` over the same island: a page by URL or HTML (served as the document at `baseUrl`, so it is a page with an origin and not an `about:blank`, which Chromium would draw in the dark scheme), `injectedJavaScript` and `injectedJavaScriptBeforeContentLoaded`, `onMessage` and `postMessage` both ways, the load and navigation events, `reload`, `goBack`, `goForward`, `stopLoading`, `webviewDebuggingEnabled` for the developer tools. Its own Windows code is for the old architecture, which react-native-windows 0.84's Fabric does not build; the origin whitelist, the media policies and `onShouldStartLoadWithRequest` are accepted without effect. |
| `expo-file-system` | `File` and `Directory` over the app's folders — `Paths.cache` and `Paths.document` under `%LOCALAPPDATA%\<app>`, `Paths.bundle` beside the exe — with the synchronous reads and writes, `info`, `md5`, `copy`, `move`, `list`, `FileHandle` byte access, `Directory.createFile` / `createDirectory`, the disk sizes, `File.downloadFileAsync` and the download and upload tasks with progress over `Windows.Web.Http`, `pickFileAsync` / `pickDirectoryAsync` through the shell's pickers, and `Watcher` over the directory's change notifications. The legacy `expo-file-system/legacy` functions answer over the same library. Pausing a download is another platform's. |
| `expo-document-picker` | `getDocumentAsync` through the shell's file picker for the app's window, filtered by the MIME types asked for, each pick copied into the cache as the package defaults to. |
| `expo-image-picker` | `launchImageLibraryAsync` through the same picker filtered to images or videos (with sizes, MIME type, file size and `base64`), `launchCameraAsync` through the Windows App SDK camera capture UI for a photo or a video. The permissions are granted: the picker is the user's and the camera's privacy setting the system's. Editing and EXIF are accepted without effect. |
| `expo-image-manipulator` | `ImageManipulator.manipulate` with resize, crop, rotate (quarter turns) and flip through `Windows.Graphics.Imaging` — the system's codecs decode JPEG, PNG, GIF, BMP, TIFF, WebP and HEIF — and `saveAsync` as JPEG at the quality asked or PNG, with `base64` when wanted, into the cache. WebP is decoded, not encoded; `extent` is web's. |
| `expo-media-library` | The user's Pictures, Videos and Music folders as the library, their folders as albums: `getAssetsAsync` (sorting, filtering and paging over the listing), `getAssetInfoAsync` with the shell's image and video properties (size, date taken, orientation, camera, location), `createAssetAsync`, `createAlbumAsync`, `addAssetsToAlbumAsync`, `removeAssetsFromAlbumAsync`, `deleteAssetsAsync`, `deleteAlbumsAsync`, and `addListener` over the shell's change notifications; the `next` API's `Asset`, `Album` and `Query` over the same. Access is granted in full — Windows asks no permission of a desktop app for them. Moments, favourites and album migration are other platforms'. |
| `expo-video` | `VideoPlayer` over a player of the runtime's media engine (`Windows.Media.Playback`) — play, pause, seek, replay, loop, volume, mute, rate, the status and time events, `replace`, `generateThumbnailsAsync`, `showNowPlayingNotification` through the shell's transport controls — and `VideoView` over a WinUI 3 `MediaPlayerElement` island with the system's controls, `contentFit`, and fullscreen on the ref. Picture in picture, caching, subtitle, audio and video tracks and external playback are other platforms': the first says no, the rest are empty. |
| `expo-audio` | `AudioPlayer` over the same engine with `playbackStatusUpdate` on the interval asked, `AudioRecorder` over `MediaCapture` into the app's cache or documents (m4a, mp3, wav, wma by extension; the inputs listed and chosen), `AudioPlaylist` here over one player at a time, and the lock-screen calls through the shell's transport controls. Windows gates the microphone in its privacy settings, so the recording permission is granted and a refused capture fails at `prepareToRecordAsync`. The audio mode, sampling and `AudioStream` are other platforms'. |
| `expo-speech` | `speak` through the system's `SpeechSynthesizer` voices (`voice`, `language`, `pitch`, `rate`, `volume`), one utterance after another, with `onStart`, `onDone`, `onStopped` and `onError`; `stop`, `pause`, `resume`, `isSpeakingAsync`, `getAvailableVoicesAsync`. The word boundary is another platform's. |
| `expo-video-thumbnails` | `getThumbnailAsync` from a frame the engine renders (`Windows.Media.Editing`) at the time asked, as JPEG at the quality or PNG at 1, into the cache; a remote video is fetched first. |
| `@expo/ui` | The universal entry over the kit: `Button`, `Switch`, `Slider`, `Checkbox`, `Picker` (and `Picker.Item`, segmented by `appearance`), `TextInput`, `BottomSheet`, `Collapsible`, `FieldGroup` with its sections, `ListItem` with its slots, `Icon` as a Segoe glyph, `useNativeState` in JavaScript — beside the layout primitives above. |
| `@expo/ui/swift-ui`, `@expo/ui/jetpack-compose` | Every export of both subpaths, and of `…/modifiers`. The controls are the kit's WinUI islands — SwiftUI's `Button`, `Toggle`, `Slider`, `Picker` (options by `tag`, segmented by `pickerStyle`), `DatePicker`, `ProgressView`, `TextField`, `SecureField`, `Stepper`, `Gauge`, `ColorPicker`, `Menu`, `ContextMenu`, `Alert`, `ConfirmationDialog`, `BottomSheet`, `Section`, `Form`, `DisclosureGroup`, `TabView`; Compose's buttons, `Switch`, `Checkbox`, `RadioButton`, `Slider`, `DateTimePicker`, the progress and loading indicators, the text fields, `SegmentedButton` rows, `ModalBottomSheet`, `DropdownMenu`, `AlertDialog`, `Card`, the chips, `Badge`, `ListItem`, `TooltipBox`, `SnackbarHost`, the search bars, `NavigationBar`, `HorizontalPager` — the stacks, rows, columns and boxes are flex views; the layout modifiers (`frame`, `padding`, `size`, `fillMax*`, `cornerRadius`, `opacity`, `hidden`, `offset`, `zIndex`, `background`, `border`, `weight`) become styles and `onTapGesture` / `clickable` a press; the rest are kept without effect. What a desktop has no counterpart for — charts, widgets, swipe actions — renders nothing and says so once in development. |
| `@expo/ui/community/*`, `@react-native-community/slider`, `@react-native-picker/picker`, `@react-native-community/datetimepicker`, `@react-native-segmented-control/segmented-control`, `react-native-pager-view`, `@react-native-masked-view/masked-view`, `@gorhom/bottom-sheet`, `@react-native-menu/menu`, `expo-checkbox` | The kit's `Slider`, `Picker`, `DateTimePicker`, `SegmentedControl`, `Sheet`, `ContextMenu` and `Checkbox` under each package's props and default export; the pager is a paging scroll view with the ref and page events; the masked view shows its content whole. Their own Windows ports are for the old architecture, which react-native-windows 0.84's Fabric does not build. |
| `expo-blur`, `expo-mesh-gradient` | Stand-ins that compose: `BlurView` is a tinted translucent surface at the intensity asked (acrylic paints white inside an island), `MeshGradientView` draws its colours as bands. |
| `@react-native-async-storage/async-storage`, `react-native-svg`, `@shopify/flash-list` | Their own Windows ports: async-storage is an architecture-neutral C++ TurboModule, react-native-svg has a Fabric build (`UseFabric`, which the New Architecture sets), and FlashList 2 is JavaScript. Autolinking picks them up (with the properties `expo-windows init` and `run` set, above); the Windows CI app depends on them and checks they are linked, and its probe route keeps a value, draws an SVG and lists rows. async-storage's module keeps its database where `ApplicationData.Current` says, which an unpackaged app cannot ask, so the runtime points it at the app's local data (`%LOCALAPPDATA%\<app>\AsyncStorage.db`) through the core application property the module reads first; an app that sets that property keeps its own. react-native-svg's shapes draw; its text did not in the harness. |
| `@react-native-community/netinfo` | `fetch`, `refresh`, `addEventListener`, `useNetInfo` and `useNetInfoInstance` over the runtime's network library — the connection profile's kind, whether it connects and reaches the internet, and the status event. Its own Windows project is from the Paper days (the UWP library props, no New Architecture switch), so `expo-windows init` keeps it out of autolinking; `configure`'s reachability settings are kept without effect. |
| every other SDK 57 package | Imports. Every native module a package asks for is registered — the ones above with an implementation, the rest from a table of the members each package's JavaScript reads — so `requireNativeModule` never throws at import and an app that carries the dependency renders. A feature the platform has not got yet answers honestly when used: a method throws the package's own `UnavailabilityError`, a permission is denied, `isAvailableAsync` is `false`. The table shrinks as modules become real. |

And the runtime's own `ExpoWindows` module, for any app that asks
`requireOptionalNativeModule('ExpoWindows')`: `setWindowTitle(title)`,
`getWindowTitleAsync()`, `setWindowChromeAsync({extend, theme})` (the content
into the title bar, the caption buttons drawn for the scheme),
`getTitleBarInsetsAsync()`, `setDragRegion(rect)` and
`setWindowBackground(color)` — what the kit's `useWindowChrome` and its
headers drive, and `expo-system-ui`'s background paints the window through —
and `getHighContrastAsync()` with `addHighContrastListener(listener)`: whether
the user has a high contrast theme on, its name, and the system's colours
for the window's parts (`background`, `text`, `highlight`, `highlightText`,
`buttonFace`, `buttonText`, `link`, `disabledText`), which the kit's palette
follows; and `showTouchKeyboardAsync()`, `hideTouchKeyboardAsync()` and
`getTouchKeyboardAsync()` for the touch keyboard, whose showing and hiding
the library raises as React Native's `keyboardDidShow` and `keyboardDidHide`
with the rectangle it covers, so `Keyboard.addListener` works on Windows
(the system shows it only while a text control has focus, and keeps one the
user brought up from the taskbar).

What has no Windows implementation and is not listed — `@expo/ui`'s
controls past its layout primitives, and any package whose module calls
`requireNativeModule` at import — still throws at import or renders
nothing. Keep it out of the Windows bundle with a `.windows.tsx` file or a
`Platform` check.

## Deep links

`init` makes the app single-instance: a launch with a URL — a protocol
activation, or `app.exe scheme://path` — hands it to the running instance
and exits, and the running app receives it as React Native's `url` event,
which `expo-linking` and Expo Router listen to. The scheme's registration is
per user and needs no manifest, so it works for the unpackaged app the
scaffold builds; a packaged app declares the protocol in its manifest as
usual.

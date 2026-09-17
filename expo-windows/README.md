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
npx expo-windows init     # writes windows/ from the cpp-app template and patches it; keeps your metro.config.js
npx expo-windows run      # expo start + run-windows
npx expo-windows bundle   # the release JavaScript, for the release build
```

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

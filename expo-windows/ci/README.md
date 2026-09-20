# The Windows build

`build.sh <workdir>` builds an Expo app for Windows end to end, on the line
react-native-windows ships. It is what CI runs.

1. A scratch Expo 57 app from `app/`, with React Native pinned to that line.
2. `npm install`, then this checkout's runtime copied into `node_modules`.
3. `expo-windows init`, which writes and patches the Windows project.
4. Autolinking, with a check that the runtime's library was registered.
5. The Windows JavaScript bundle.
6. MSBuild with the v143 toolset, Debug and Release.
7. The MSIX package, self-signed.
8. The Windows App Runtime, which a clean machine has not got.
9. A smoke launch of the Release exe, held to budgets for cold start and
   working set.

`STOP_AFTER=bundle` stops after step 5. That takes minutes rather than the
better part of an hour, needs no Visual Studio, and opens no window.

## The probe

`app/` is the app it builds when nothing else is said. Its manifest carries
every SDK 57 package. `/packages` imports them all and asks each what it can
do, and the other routes each exercise a part of the runtime: the device, data,
images, media, capture, sensing, notifications, web content, the community
packages with Windows ports of their own, and crash reports.

It is drawn with React Native's own views (`src/probe.tsx`) and shows a route
through Expo Router's `Slot`, so it proves the runtime with no UI kit installed.

## Another app over the same road

| Variable | What it is |
| --- | --- |
| `APP_SOURCE` | An app's folder. Its `src`, `assets`, `app.json` and `tsconfig.json` stand in for the probe's. |
| `EXTRA_SOURCE` | A folder copied over the app's `src`: more routes. |
| `EXTRA_DEPENDENCIES` | `name@range` pairs the app needs and the scratch app's manifest lacks. |
| `OVERLAY` | `name=folder` pairs: packages copied from a checkout into `node_modules`, the way the runtime always is. Each is then listed as a dependency, which is how autolinking and the runtime's alias discovery find it. |
| `EXPECT_LINKED` | Names autolinking must have registered, besides the runtime's. |
| `RN_VERSION`, `RNW_VERSION` | Another line than the template's, together. |
| `CLI_VERSION` | The React Native community CLI for that line. |
| `WINDOWS_SDK`, `TOOLSET` | The target SDK and the platform toolset, where the defaults do not fit. |
| `SMOKE_MAX_MS`, `SMOKE_MAX_KB` | The smoke run's budgets. |

Lists are separated by spaces, so a folder's path cannot hold one.

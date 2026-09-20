# expo-vitest

Vitest for Expo code on every platform it runs on: iOS, Android, web and
Windows. One call makes a Vitest project per platform, a test file's name
decides which of them run it, and a harness drives the running app and reads
the accessibility tree it drew.

It is built on [`vitest-expo`](https://github.com/niondigital/vitest-expo) and
[`vitest-native`](https://github.com/danfry1/vitest-native), which run React
Native's real JavaScript for iOS and Android under Vitest. This package adds
what a library or app with a file per platform needs on top of them:

- a Windows project, for code with `.windows.tsx` files on
  react-native-windows
- a web project that loads Expo's packages under Vite and react-native-web
- the file-name convention that sends each test to the right platforms
- helpers for asserting on native views, Windows native components and an
  Expo Router app
- device tests and a command line over one set of drivers for web, Windows,
  Android and iOS

## Versions

| | |
| --- | --- |
| Expo SDK | 57 |
| Vitest | 4 |
| `vitest-expo` | 57.1 |
| `vitest-native` | 0.13 |

## Setup

```sh
npx expo install expo-vitest vitest vitest-expo vitest-native \
  @testing-library/react-native @testing-library/react @testing-library/jest-dom jsdom
```

`vitest.config.mts`:

```ts
import {defineConfig} from 'vitest/config';
import {expoProjects} from 'expo-vitest';

export default defineConfig({
  test: {projects: expoProjects()},
});
```

`tsconfig.json`, for the globals and the jest-dom matchers on `expect`:

```json
{"compilerOptions": {"types": ["vitest-expo/types", "expo-vitest/types"]}}
```

Run one project with `vitest run --project windows`, and one file by adding its
path.

## Which tests run where

| File name | Runs on |
| --- | --- |
| `*.test.ts` | iOS, Android, web and Windows |
| `*.test.tsx` | iOS, Android and web |
| `*.native.test.tsx` | iOS and Android |
| `*.ios.test.tsx` | iOS |
| `*.android.test.tsx` | Android |
| `*.web.test.tsx` | web |
| `*.windows.test.tsx` | Windows |

A `.test.ts` file holds logic with nothing rendered, which is the same
everywhere, so it runs everywhere. A `.test.tsx` file renders, and what it
renders on Windows is a different tree from the other three, so Windows takes
only the files named for it.

## The projects

**iOS and Android** run on vitest-native's engine: React Native's own
JavaScript with the native boundary mocked, `Platform.OS` set, and platform
files resolved in Metro's order. Tests use React Native Testing Library, which
is asynchronous in version 14: `await render(...)`, `await fireEvent(...)`.

The native setup gives `@expo/ui` the two things its generic mock lacks:
`ObservableState`, behind `useNativeState`, and `getMaterialColors`, which the
Compose `Host` calls. A test file can still `vi.mock('expo', ...)` for itself.

**Web** is react-native-web in jsdom. Expo's packages only load there once
Vite's dependency optimizer has pre-bundled them with the Metro behaviours
they rely on, which `metroCompat` supplies: source extensions appended past an
apparent extension, the `.web` twin preferred, and an ambient type file served
as an empty module. Only the packages that are installed are pre-bundled. Tests
use `@testing-library/react` and the jest-dom matchers.

**Windows** runs on the iOS engine, because react-native-windows has no test
renderer and vitest-native has no Windows engine. What the code under test
branches on says Windows: `Platform.OS`, `Platform.select`, `EXPO_OS`, and
`.windows.*` files resolved first for the project's own code. React Native's
own files keep the iOS order, since they have no Windows variants outside
react-native-windows. A native component renders as a host view named after
it, whose props are the payload handed to the C++ side, and that is what a
Windows test asserts on.

## Options

```ts
expoProjects({
  root: process.cwd(),
  platforms: ['ios', 'android', 'windows', 'web'],
  include: ['src'],
  transformPackages: [],
  timeout: 15_000,
  windows: {name: 'windows', forbid: [], resolveIn: [], include: undefined},
  web: {optimize: [], alias: []},
});
```

| Option | What it does |
| --- | --- |
| `root` | The project's folder. Set it when Vitest runs from a folder above, as in a monorepo. |
| `platforms` | Which projects to make. |
| `include` | The folders that hold tests, from the root. |
| `transformPackages` | More packages that ship TypeScript or untranspiled sources, besides Expo's. |
| `timeout` | How long one test may take. Fifteen seconds, since the projects run in parallel and coverage slows each. |
| `windows.forbid` | Modules with no Windows implementation. Importing one throws, with the module's name. |
| `windows.resolveIn` | More folders whose relative imports resolve `.windows.*` first, from the root. An app names the source of a library it installed: `node_modules/a-kit/src`. |
| `windows.include` | The test files, in place of the ones the names pick. A package for Windows alone runs every test there. |
| `windows.name` | The project's name. |
| `web.optimize` | More packages to pre-bundle. |
| `web.alias` | More aliases for the web project. |

Projects do not inherit the root `test` block in Vitest, so each one carries
its own globals, mock clearing and timeout. Coverage and reporters stay in the
root block, which is yours.

### Forbidden modules

A module with no implementation on a platform usually calls
`requireNativeModule` as it loads and throws without the native side. A
component that imports one kills an app before its first render, and a test on
an engine that happens to have the module would pass. Name those modules and
the import fails the test instead:

```ts
expoProjects({windows: {forbid: ['@expo/ui', 'expo-image', 'expo-symbols']}});
```

Type-only imports are erased and stay fine. A test can still `vi.mock` a
forbidden module for itself.

### Node code beside it

```ts
import {expoProjects, nodeProject} from 'expo-vitest';

projects: [...expoProjects(), nodeProject({name: 'cli', include: ['cli/**/*.test.js']})];
```

## Helpers

`expo-vitest/native`, for iOS and Android. `@expo/ui` components render as
`ViewManagerAdapter_ExpoUI_*` host views whose props are the payload handed to
SwiftUI or Compose.

| | |
| --- | --- |
| `nodes(root?)` | Every host node of the rendered tree, flattened. |
| `host(predicate)` | The first host node whose props match. Throws with an outline of the tree. |
| `modifier(props, type)` | The SwiftUI or Compose modifier of that `$type` from a `modifiers` prop. |
| `byComposeTestID(id)` | The host node carrying a Compose `testID` modifier. |
| `stackHeaders()` | The `headerConfig` of each mounted native stack item. |

`expo-vitest/windows`, for Windows native components.

| | |
| --- | --- |
| `island(name, index?)` | The host view of a native component by its name. Throws when there is none. |
| `islands(name)` | Every one, in order. |
| `fireIsland(view, event, payload?)` | Fires a native event as the C++ side dispatches it. Always awaited. |

`expo-vitest/router`, on every platform.

| | |
| --- | --- |
| `renderApp(routes, initialUrl?)` | Mounts an Expo Router app from an in-memory `app/` folder: route name to screen. Query with React Native Testing Library's `screen` on native and Windows, and `@testing-library/react`'s on web. |

## Device tests and the harness

Component tests cannot see a whole app: its own Babel configuration, a real
renderer. Device tests drive a running build and read what it actually drew.
The assertion is the accessibility tree rather than the pixels, since a tree is
stable across machines, diffs legibly, and is what a screen reader reads.

`vitest.config.device.mts`:

```ts
import {defineConfig} from 'vitest/config';
import {deviceConfig} from 'expo-vitest';

export default defineConfig(deviceConfig());
```

```ts
import {by, device, element} from 'expo-vitest/device';

it('opens settings', async () => {
  await device.open('/');
  await element(by.label('Settings')).press();
  const tree = await device.fullSnapshot();
  expect(tree).toHaveElement(by.label('Name'));
  expect(tree).toBeFullyLabelled();
  await expect(device).toMatchScreenshot('settings');
});
```

```sh
HARNESS_PLATFORM=web HARNESS_URL=http://localhost:8081 vitest run --config vitest.config.device.mts
HARNESS_PLATFORM=windows HARNESS_TARGET=path/to/App.exe vitest run --config vitest.config.device.mts
```

`toHaveElement` and `toBeFullyLabelled` take a snapshot.
`toSupportArrowNavigation` and `toMatchScreenshot` take the device and are
awaited. Screenshots and their
baselines are kept under the project: `.harness/` and
`device/__screenshots__/<platform>/`.

The same drivers are a command, `expo-harness`, for looking at a screen by
hand. Web is a headless Chromium through `playwright-core`, Windows is UI
Automation and synthetic input, iOS and Android go through `agent-device`. See
[HARNESS.md](HARNESS.md).

## Other users of the web pipeline

Anything else that runs Expo code through Vite and react-native-web needs the
same Metro behaviours. A web Storybook does:

```ts
import {EXPO_WEB_PACKAGES, metroCompat} from 'expo-vitest/metro-compat';
```

## Limits

- The Windows project is React Native's iOS JavaScript told it is Windows. It
  proves the props and events of a native component and the logic around them.
  It does not run react-native-windows, so what only that renderer does is
  for a device test.
- Only relative imports of the code under test resolve `.windows.*` first. A
  package in `node_modules` resolves as the engine would, unless its folder is
  named in `windows.resolveIn`.
- Jest compatibility is off. Tests use `vi`.

## Working on it

The package runs from its TypeScript source in this repository, which Node
allows outside `node_modules`. Installed it has to be JavaScript, so
`prepack` compiles `src` to `dist`. `bun run test:fixture` packs the package,
unpacks it into `fixture/node_modules` and runs the fixture's tests against it
by name, which is how it is known to work installed.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## What this repository is

`expo-windows`: the Windows platform for Expo apps, on react-native-windows.
[The design document](docs/expo-windows.md) is the reference for what it does.

| Path | What |
| --- | --- |
| `metro/` | `withWindows`, the Metro config for the `windows` platform, and its transformer. Node, JavaScript with JSDoc types |
| `src/install.windows.ts` | what runs before an app's entry: Expo Modules Core's global over a JavaScript registry, and the modules |
| `src/modules/` | the module each Expo package finds on Windows |
| `src/aliases/` | the files `withWindows` resolves a package to where it has no Windows implementation |
| `src/windows/specs/` | the Fabric component specs of the runtime's islands |
| `windows/ExpoWindows/` | the C++/WinRT library: the native modules and the islands |
| `cli/` | `expo-windows init`, `run`, `bundle`, `package`. Node, JavaScript with JSDoc types |
| `ci/` | the end to end build, and the probe app it builds |
| `fixture/` | the smallest Expo project there is, for the Node tests that read a real one |

## Before reporting anything done

```sh
bun run lint            # oxlint, zero warnings
bun run typecheck       # tsc, the JavaScript included
bun run test:coverage   # vitest, both projects
```

Coverage thresholds are **100%** on lines, branches, functions and statements,
so a new branch without a test fails the run. To find what is uncovered, parse
`coverage/lcov.info` for `DA:…,0` and `BRDA:…,0` rather than reading the table.

Two Vitest projects, both from `expo-vitest`. `expo-windows` runs `src/` on the
React Native engine told it is Windows; every test there is a Windows test
whatever its name. `expo-windows-node` runs `metro/` and `cli/` in Node. React
Native Testing Library 14 is async: `await render(...)`, `await fireEvent(...)`.

## The version wall

Expo SDK 57 pins React Native 0.86.3; react-native-windows' newest line is 0.84.
Do not declare `react-native-windows` as a dependency or a peer. The platform is
built and tested against the pinned 0.84 line by `ci/build.sh`, which CI runs on
every push, and against the newest preview, which is allowed to fail.

## The runtime knows no UI kit

`@expo/ui` and the community controls are drawn with controls, and the runtime
has none. A kit answers for them through the aliases it contributes: a
dependency of the app names a JSON table in its `package.json` under
`"expo-windows": {"aliases": …}` and `withWindows` finds it. Nothing here may
import a kit, and the probe app in `ci/app` is drawn with React Native's own
views so that the runtime is proved without one.

## Building and verifying

`ci/build.sh <workdir>` is the whole road: scratch app, `init`, autolink, bundle,
Debug, Release, package, the Windows App Runtime, and a smoke launch that
reports cold start and working set. `STOP_AFTER=bundle` stops once the bundle is
written: a few minutes, no MSBuild, no window. See `ci/README.md`.

- The react-native-windows CLI loads its commands through PowerShell 7 and a
  .NET SDK. Without both on the PATH, `init` fails with
  `unknown command 'init-windows'`, which says nothing about either.
- A clean machine differs from a developer's in three ways, all handled in the
  script: MSBuild's path comes from `vswhere`, the Windows SDK is whichever is
  installed, and an unpackaged app needs the Windows App Runtime installed
  before it can start.
- A build error in one file can still print `msbuild exit: 0` when the app
  target links the old DLL. Check the DLL's timestamp.

## Islands

A component view is `winrt::implements<T, IInspectable>`, the codegen base for
its spec, and `XamlIsland<T>`; it creates its control and calls `Attach` from
`InitializeIsland`. The runtime's islands take the size the layout gives them.

- An island takes pointer input for itself regardless of RN `pointerEvents`.
- An island's root is white wherever its control is transparent.
- Call `EnsureXaml()` before any control. Never alias `Color` in runtime C++:
  `Microsoft.ReactNative.Color` makes it ambiguous; use `Rgba`.
- Event names must not collide with core bubbling events (`onPress`,
  `onKeyPress`).

## The C++ toolchain

- MSVC treats `_wfopen` as an error; use `_wfopen_s`. `L' '` in a wide char
  literal warns C4066; write `0x00A0`.
- A `fire_and_forget` `REACT_METHOD` may `co_await`; a helper returning
  `IAsyncOperation<T>` needs `T` to be a WinRT type, never `JSValue`.
- `ReactPromise` copies share state, and the destructor rejects with
  "Promise destroyed." when the last copy dies unsettled. Hold what owns an
  event registration for the life of the job: a dropped `CoreWebView2` wrapper
  takes its handlers with it.
- **WebView2 allows one environment configuration per process.** Create one the
  way WinUI does (default folders, first application language) or WinUI's own
  WebView2 fails and `MapControl` crashes.

## Codegen

Specs live in `src/windows/specs/`. Run `bun run codegen:windows` after any spec
change and commit the generated headers. It goes through `npm exec`, never
`bunx`, which rewrites `npx --package`. A `WithDefault<boolean, false>` prop
generates `std::optional<bool>`; a `true` default generates a plain `bool`.

## Platform files

- **Metro tries every source extension before every platform.** A platform file
  must not use a later extension than its siblings: with `library.native.ts`
  present, `library.windows.tsx` never wins.
- **A `.windows.ts` file must not import its plain twin by bare specifier.**
  `./install` resolves to itself on Windows. Shared pieces go in a third file.

## Toolchain traps

- `npx tsc` resolves a bogus package here. Use `bun run typecheck`, or
  `node node_modules/typescript/bin/tsc --noEmit`.
- bun must be 1.4+ for an install. An older bun silently downgrades the
  lockfile and re-resolves every package.

## Writing

Plain sentences, no em dashes. Say what the reader cannot see from the code.

## Commits

One change per commit, with a message that says why the change was needed and
what was verified. Never push unless asked.

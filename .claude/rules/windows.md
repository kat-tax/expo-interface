---
paths:
  - "windows/**"
  - "**/*.windows.ts"
  - "**/*.windows.tsx"
  - "scripts/windows-ci.sh"
---

# Windows

`windows/ExpoInterface` is this repository's C++/WinRT library: it hosts the
kit's WinUI controls as Fabric components. The platform under it is
`expo-windows`, a repository of its own (Metro config, the Expo SDK's modules,
the CLI that writes, builds and packages the app). Nothing here implements the
platform; a fault in it belongs there.

## Islands

A component view is `winrt::implements<T, IInspectable>`, the codegen base for
its spec, and `XamlIsland<T>`; it creates its control and calls `Attach` from
`InitializeIsland`. The kit's islands report the size their control wants to
Yoga through `ReportDesiredSize`.

- **An island takes pointer input for itself regardless of RN `pointerEvents`.**
  An overlay island swallows presses meant for what is under it: anchors are a
  1-pixel strip or a 1x1 point.
- **An island's root is white wherever its control is transparent.** Paint the
  scheme's background in the RN tree behind it.
- Call `EnsureXaml()` before any control.
- When a prop replaces a control's content, the island must re-measure
  (`Remeasure()`), or Yoga keeps the old size.
- Event names must not collide with core bubbling events (`onPress`,
  `onKeyPress`).
- A control that wraps content (`Expander`, `SwipeControl`, `TabView` items,
  `Flyout` content) cannot hold React Native content. Draw the content beside or
  under the island instead.

## The C++ toolchain

- `L' '` in a wide char literal warns C4066: write `0x00A0`.
- `ReactPromise` copies share state, and the destructor rejects with
  "Promise destroyed." when the last copy dies unsettled. Hold what owns the
  work for the life of the job.
- A build error in one file can still print `msbuild exit: 0` when the app target
  links the old DLL. Check the DLL's timestamp.

## Building and verifying

`scripts/windows-ci.sh <workdir>` is the whole road for the example: scratch app,
`init`, autolink, bundle, Debug, Release, package, the Windows App Runtime, and a
smoke launch that reports cold start and working set. It is what CI runs, and
the fastest way to prove a change end to end. The road itself is the runtime's,
`ci/build.sh` in a checkout of `expo-windows` (`EXPO_WINDOWS_DIR`, beside this
repository unless said): this script hands it the example's source, this
checkout's kit to overlay, and the route that draws `@expo/ui` through the kit's
aliases.

`STOP_AFTER=bundle` stops it once the bundle is written: a few minutes, no
MSBuild, no window. The react-native-windows CLI loads its commands through
PowerShell 7 and a .NET SDK: without both on the PATH, `init` fails with
`unknown command 'init-windows'`, which says nothing about either.

A clean machine differs from this one in three ways, all handled in that script:
MSBuild's path comes from `vswhere`, the Windows SDK is whichever is installed,
and an unpackaged app needs the Windows App Runtime installed before it can start.

To look at a running build rather than build one, the harness drives it:

```sh
bun run harness -p windows --target <path to the exe> open /detail screenshot detail.png tree
```

`tree` is the UI Automation tree Narrator reads, and it is how an island with no
accessible name is found. A WinUI `MenuFlyout` opens in a window of its own and
leaves no trace in that tree, so a menu is verified with a screenshot. Synthetic
input goes to whatever is in front, so `tap` refuses while someone is using the
machine unless `--force` says otherwise.

## Codegen

Specs live in `src/windows/specs/`. Run `bun run codegen:windows` after any spec
change and commit the generated headers. A `WithDefault<boolean, false>` prop
generates `std::optional<bool>`; a `true` default generates a plain `bool`.

## The aliases

`src/windows/aliases/` answers for `@expo/ui`, the community controls and
`expo-checkbox` on Windows, and `aliases.json` is the table `expo-windows`
reads from this package's manifest. A file there is a Windows file like any
other: it may import the kit, never a module the Windows project forbids.

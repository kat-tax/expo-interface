---
paths:
  - "windows/**"
  - "expo-windows/**"
  - "**/*.windows.ts"
  - "**/*.windows.tsx"
  - "scripts/windows-ci.sh"
---

# Windows

Two libraries. `windows/ExpoInterface` hosts the kit's WinUI controls as Fabric
components; `expo-windows` is the runtime that gives an Expo app the platform at
all — Metro config, an Expo Modules Core over a JavaScript registry, the SDK's
modules in C++/WinRT, and the CLI that writes, builds, packages and ships the app.

## Islands

A component view is `winrt::implements<T, IInspectable>`, the codegen base for
its spec, and `XamlIsland<T>`; it creates its control and calls `Attach` from
`InitializeIsland`. The kit's islands report the size their control wants to Yoga
through `ReportDesiredSize`; the runtime's take the size the layout gives them.

- **An island takes pointer input for itself regardless of RN `pointerEvents`.**
  An overlay island swallows presses meant for what is under it: anchors are a
  1-pixel strip or a 1×1 point.
- **An island's root is white wherever its control is transparent.** Paint the
  scheme's background in the RN tree behind it.
- Call `EnsureXaml()` before any control. Never alias `Color` in runtime C++ —
  `Microsoft.ReactNative.Color` makes it ambiguous; use `Rgba`.
- When a prop replaces a control's content, the island must re-measure
  (`Remeasure()`), or Yoga keeps the old size.
- Event names must not collide with core bubbling events (`onPress`,
  `onKeyPress`).

## The C++ toolchain

- MSVC treats `_wfopen` as an error; use `_wfopen_s`. `L' '` in a wide char
  literal warns C4066 — write `0x00A0`.
- A `fire_and_forget` `REACT_METHOD` may `co_await`; a helper returning
  `IAsyncOperation<T>` needs `T` to be a WinRT type, never `JSValue`.
- `ReactPromise` copies share state, and the destructor rejects with
  "Promise destroyed." when the last copy dies unsettled. Hold what owns an
  event registration for the life of the job — a dropped `CoreWebView2` wrapper
  takes its handlers with it.
- **WebView2 allows one environment configuration per process.** Create one the
  way WinUI does (default folders, first application language) or WinUI's own
  WebView2 fails and `MapControl` crashes.
- A build error in one file can still print `msbuild exit: 0` when the app target
  links the old DLL. Check the DLL's timestamp.

## Building and verifying

`scripts/windows-ci.sh <workdir>` is the whole road: scratch app, `init`,
autolink, bundle, Debug, Release, package, the Windows App Runtime, and a smoke
launch that reports cold start and working set. It is what CI runs, and the
fastest way to prove a change end to end.

A clean machine differs from this one in three ways, all handled in that script:
MSBuild's path comes from `vswhere`, the Windows SDK is whichever is installed,
and an unpackaged app needs the Windows App Runtime installed before it can start.

## Codegen

Specs live in `src/windows/specs/` (the kit) and `expo-windows/src/windows/specs/`
(the runtime). Run `bun run codegen:windows` after any spec change and commit the
generated headers. A `WithDefault<boolean, false>` prop generates
`std::optional<bool>`; a `true` default generates a plain `bool`.

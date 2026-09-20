# Contributing

[Docs home](README.md)

## The repository

| Path | What |
| --- | --- |
| `src/` | The kit itself, published as `expo-interface`. |
| `example/` | dropfiles, the app the kit is dogfooded in. It uses every component and imports the package from `../src`. |
| `storybook/` | Two Storybooks over `src/**/*.stories.tsx`: a web one and an on-device one. |
| `windows/ExpoInterface/` | The C++/WinRT library with the kit's XAML islands. |
| `scripts/` | The Windows build wrapper and the Segoe glyph table generator. |

Two things the kit stands on are repositories of their own:
[expo-windows](https://github.com/kat-tax/expo-windows), the Windows platform
runtime, and [expo-vitest](https://github.com/kat-tax/expo-vitest), which makes
the per-platform Vitest projects and has the test helpers and the harness.

`AGENTS.md` at the root has the conventions and the toolchain traps.

## How the kit is built

- A component is one directory with `types.ts` and a file per platform:
  `index.tsx`, `index.ios.tsx`, `index.android.tsx`, `index.web.tsx`,
  `index.windows.tsx`. A platform without its own file uses `index.tsx`.
- Where a platform has the control, the kit hosts it. Where it does not, the
  kit draws it with that platform's metrics, and the documentation says so.
- A prop a platform cannot honour is documented as absent there. Nothing is
  faked.
- Value controls are controlled: `value` pairs with `onValueChange`.
- Nothing of `@expo/ui`, `expo-image`, `expo-symbols`, `expo-web-browser` or
  `expo-system-ui` is imported by a Windows file. A test imports the whole
  package with those modules forbidden.

Two rules about platform files cost a debugging round trip each:

- **Metro tries every source extension before every platform.** A platform
  file must not use a later extension than its siblings: with
  `library.native.ts` present, `library.windows.tsx` never wins. Keep the
  extension the same.
- **A `.windows.ts` file must not import its plain twin by bare specifier.**
  `./contrast` resolves to itself on Windows. Shared pieces go in a third file.

And one about names: never give a module-scope binding a name the language
already uses, `Symbol` above all. The React Compiler emits
`Symbol.for(...)` into every component it compiles, and an import called
`Symbol` shadows the global, so the app dies at render.

## Running it

```sh
bun install        # bun 1.4 or later
bun run web        # or ios, android
```

## Checks

```sh
bun run lint        # oxlint, zero warnings
bun run typecheck   # tsc across the kit, the example and the Storybooks
bun run test        # vitest, every platform project
```

Coverage is 100% on lines, branches, functions and statements, so a new branch
without a test fails the run. `bun run test:coverage` writes a report to
`test-report/` and coverage to `coverage/`. `bun run test:ui` is Vitest's watch
mode with the browser UI.

## Tests

Vitest runs the suite once per platform (`ios`, `android`, `windows`, `web`)
through [expo-vitest](https://github.com/kat-tax/expo-vitest). A file's name
decides where it runs:

| Pattern | Platforms |
| --- | --- |
| `*.test.ts` | ios, android, windows, web |
| `*.test.tsx` | ios, android, web |
| `*.native.test.tsx` | ios, android |
| `*.ios.test.tsx`, `*.android.test.tsx`, `*.web.test.tsx`, `*.windows.test.tsx` | one platform |

The windows project is the iOS engine told it is Windows. `@expo/ui` and the
other modules with no Windows implementation are forbidden there, so a Windows
file that reaches for one fails its test rather than the app. The XAML islands
render as host views whose props are the payload the C++ side receives.

## Storybook

Stories live next to each component (`src/<name>/<name>.stories.tsx`) and are
shared by two Storybooks in the `storybook` workspace:

- A web one with MDX guides, a props table per component and the testing
  widget. It is the site published to
  [GitHub Pages](https://kat-tax.github.io/expo-interface/).
- An on-device one that renders the real SwiftUI and Compose controls.

```sh
bun run storybook:web      # web storybook and docs site
bun run storybook:ios      # or storybook:android
bun run storybook:build    # static web build in storybook/dist
bun run storybook:test     # every story as a Vitest browser test, with axe
```

Every story runs in headless Chromium through Vitest browser mode with axe at
the error level.

## The harness

```sh
bun run harness doctor
bun run harness -p web --url http://localhost:8085 open / screenshot home.png tree
```

One command drives the kit on web, Windows, Android and iOS: open a route,
press, type, screenshot, and read the accessibility tree a screen reader
reads. It is `expo-vitest`'s. See
[its guide](https://github.com/kat-tax/expo-vitest/blob/master/docs/harness.md).

Tests prove behaviour. The harness is how you see the thing itself, and it is
the only way to catch what only appears in a real renderer.

`bun run test:device` runs the device suite in `device/` against whatever app
is up.

## Windows

### The native library

Each kit control with a WinUI counterpart is a Fabric native component in
`windows/ExpoInterface`. The specs in `src/windows/specs/` are the contract.
After any spec change:

```sh
bun run codegen:windows
```

Commit the generated headers. The script goes through `npm exec`, never
`bunx`, which rewrites `npx --package`.

### The glyph table

`bun run segoe:windows` regenerates `SEGOE_GLYPHS` from the names
`expo-symbols` types and the Segoe Fluent Icons catalogue. A test fails when a
Material name used in the kit, its stories or the example has no glyph. See
[Windows glyphs](icons.md#windows-glyphs).

### The build

Expo SDK 57 pins React Native 0.86.3, and react-native-windows' newest line is
0.84. Do not add `react-native-windows` to the example. There is no `windows/`
folder in it either.

`scripts/windows-ci.sh` builds the example's source in a scratch app on the
0.84 line, by running `expo-windows`' `ci/build.sh` over it from a checkout at
`EXPO_WINDOWS_DIR` (`../expo-windows` by default):

```sh
bash scripts/windows-ci.sh path/to/workdir
STOP_AFTER=bundle bash scripts/windows-ci.sh path/to/workdir   # minutes, no MSBuild, no window
```

To test the kit against an unreleased runtime, point `EXPO_WINDOWS_DIR` at the
checkout, or give the Windows workflow a `runtime-ref`.

## CI

| Workflow | When | What |
| --- | --- | --- |
| `ci.yml` | Pushes to `master` and pull requests | Typecheck, lint, the tests with coverage, the device suite against the example on web, a Metro export of the example for ios, android and web, and a web Storybook build after its stories pass as browser tests. |
| `windows.yml` | Changes to the kit or the example | The example built end to end over a checkout of `expo-windows`, on the react-native-windows line the template ships, plus the newest preview, which is allowed to fail. |
| `storybook.yml` | Pushes to `master` | Publishes the web Storybook to GitHub Pages. |
| `release.yml` | A `v*` tag matching `package.json` | Re-runs the checks, publishes to npm with provenance and creates a GitHub release. |

## Documentation

The README is the front page: onboarding, then a summary of the features that
links to the pages in `docs/`. A change to a component changes its entry in
`docs/components/`. A difference between platforms also goes in
[Where platforms differ](platform-differences.md).

## Commits and writing

One change per commit, with a message that says what the reader cannot see
from the diff: why the change was needed, and what was verified. Plain
sentences, no em dashes.

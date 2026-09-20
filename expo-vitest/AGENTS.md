# expo-vitest

Vitest for Expo code on iOS, Android, web and Windows: a project per platform
picked by a test file's name, helpers for the tests, and a harness that drives
a running app. Built on `vitest-expo` and `vitest-native`. The README is the
reference; HARNESS.md is the harness's.

| Path | What |
| --- | --- |
| `src/projects.ts` | `expoProjects`, `nodeProject`, `deviceConfig`: everything a consumer's config calls |
| `src/windows-resolution.ts`, `src/forbid-modules.ts`, `src/metro-compat.ts` | the three Vite plugins |
| `src/setup/` | the setup file of each project |
| `src/native.ts`, `src/windows.ts`, `src/router.tsx` | the test helpers, one subpath each |
| `src/device/` | the device object and its matchers, over the harness's drivers |
| `src/harness/` | the drivers and the `expo-harness` command |
| `fixture/` | a one-constant library with a test per file-name rule, run against the packed package |

## Before reporting anything done

```sh
bun run lint            # oxlint, zero warnings
bun run typecheck       # tsc
bun run test:coverage   # the logic, in Node, 100% on the files named in vitest.config.mts
bun run test:fixture    # the packed package, installed, on all four projects
```

The unit tests cover what is logic and nothing else. A setup file, a Node
require hook and a device driver are proved by the fixture and by device tests,
so a change to one of them is not done until the fixture has run.

## How it is built

- **It runs from source here and from `dist` installed.** Node strips types from
  a `.ts` file outside `node_modules` and refuses to inside it, and a Vitest
  config is loaded by Node. So relative imports carry the `.ts` extension, the
  build rewrites them to `.js`, and `prepack` runs the build. No enums, no
  parameter properties, no namespaces: type stripping cannot erase them.
- **`file()` in `src/projects.ts` is how the package finds its own files**,
  `.ts` from source and `.js` compiled. A new setup file or subpath goes through
  it. A new subpath goes in `SUBPATHS` and in `package.json`'s `exports`; a test
  fails if the two disagree.
- **The projects alias the package's subpaths to absolute files and keep
  `node_modules/expo-vitest/` in the Vite graph.** Without the first a test and
  a setup file can load two copies of a helper. Without the second a setup
  file's `vi.mock` is not hoisted. The pattern is anchored on `node_modules`
  because this checkout is a folder called `expo-vitest` too.
- **Each project sets Vite's `root` and Vitest's `test.root`.** vitest-native
  reads the first. Where they differ the engine resolves packages from one
  folder for code that lives in another.
- **The project root is the working directory**, or `HARNESS_ROOT`. Never work
  it out from a file's own location: installed, that is the package.

## Writing

Say what the reader cannot see from the code: why, and what was verified. Plain
sentences, no em dashes.

## Commits

One change per commit, with a message that says why the change was needed and
what was verified. Never push unless asked.

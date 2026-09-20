# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## What this repository is

A universal UI kit for Expo SDK 57. Every component renders the platform's own
control: SwiftUI on iOS, Jetpack Compose on Android, the DOM on web, WinUI 3 on
Windows. What is here:

| Path | What |
| --- | --- |
| `src/` | the kit itself, published as `expo-interface` |
| `example/` | the dropfiles app the kit is dogfooded in |
| `storybook/` | two Storybooks (web and on-device) over `src/**/*.stories.tsx` |
| `docs/` | the documentation, one page per topic; the README is the front page that onboards and links into it, and a change to a component changes its entry in `docs/components/` |

Two things the kit stands on are repositories of their own: `expo-windows`
(https://github.com/kat-tax/expo-windows), the Windows platform runtime, and `expo-vitest`
(https://github.com/kat-tax/expo-vitest), which makes the per-platform Vitest projects and has
the test helpers and the harness.

## Before reporting anything done

```sh
bun run lint        # oxlint, zero warnings
bun run typecheck   # tsc across the kit, the example and the Storybooks
bun run test        # vitest, every platform project
```

Coverage thresholds are **100%** on lines, branches, functions and statements,
so a new branch without a test fails the run. `bun run test:coverage` writes
`coverage/`; to find what is uncovered, parse `coverage/lcov.info` for `DA:…,0`
and `BRDA:…,0` rather than reading the text table.

## Toolchain traps

- **`npx tsc` resolves a bogus package here.** Use `bun run typecheck`, or
  `node node_modules/typescript/bin/tsc --noEmit` for one project. The same goes
  for the other tools: prefer `bun run <script>` or `node node_modules/<tool>`.
- **bun must be 1.4+** for an install (`packageManager` pins it, and `bun.lock`
  is `lockfileVersion: 2`). An older bun silently downgrades the lockfile and
  re-resolves every package. Check `bun --version`; below 1.4 install through
  `npm exec --yes --package=bun@1.4.0 -- bun install`. Running scripts is fine
  on any version.
- **Codegen goes through `npm exec`**, never `bunx` — bun rewrites
  `npx --package`. Regenerate after any spec change and commit the headers:
  `bun run codegen:windows`.

## Looking at what it drew

```sh
bun run harness doctor          # what this machine can drive
bun run harness -p web --url http://localhost:8085 open / screenshot home.png tree
```

One command drives the kit on web, Windows, Android and iOS: open a route,
press, type, screenshot, and read the accessibility tree a screen reader reads.
See https://github.com/kat-tax/expo-vitest/blob/master/docs/harness.md. Tests prove behaviour; the harness is how you
see the thing itself, and it is the only way to catch what only appears in a
real renderer.

## Naming

**Never give a module-scope binding a name the language already uses** —
`Symbol` above all. The React Compiler emits `Symbol.for("react.memo_cache_sentinel")`
into every component it compiles, and an import or declaration called `Symbol`
shadows the global, so the whole app dies at render with
`Symbol.for is not a function`. The kit's icon component was called `Symbol`
and did exactly that; it is `Icon` now. Nothing in the tests can see this —
only a real renderer with the app's own Babel configuration puts that call
into the module, which is what the harness is for.

## Platform files

A component is one directory with `types.ts` and a file per platform
(`index.tsx`, `index.ios.tsx`, `index.android.tsx`, `index.web.tsx`,
`index.windows.tsx`). Two rules that cost a debugging round trip each:

- **Metro tries every source extension before every platform.** A platform file
  must not use a later extension than its siblings: with `library.native.ts`
  present, `library.windows.tsx` never wins. Keep the extension the same.
- **A `.windows.ts` file must not import its plain twin by bare specifier** —
  `./contrast` resolves to itself on Windows. Shared pieces go in a third file.

## The version wall

Expo SDK 57 pins React Native 0.86.3; react-native-windows' newest line is 0.84.
Do not add `react-native-windows` to the example or declare it as a peer of
`expo-windows`. The Windows platform is built and tested against the pinned 0.84
line by the runtime's build script, which `scripts/windows-ci.sh` runs over the
example on every push.

## Commits

One change per commit, with a message that says what the reader cannot see from
the diff: why the change was needed, and what was verified. Never push unless
asked.

---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "vitest.config.mts"
---

# Tests

Vitest 4 with `vitest-expo`, no jest. The four projects come from the
`expo-vitest` package: `vitest.config.mts` calls `expoProjects()`. **A file's
name decides which platforms run it**:

| Name | Runs in |
| --- | --- |
| `src/**/*.test.tsx` | ios, android, web |
| `src/**/*.test.ts` | ios, android, web **and windows** |
| `src/**/*.ios.test.tsx` | ios only (same for `.android.`, `.web.`, `.windows.`) |
| `src/**/*.native.test.tsx` | ios and android |

Run one project with `node node_modules/vitest/vitest.mjs run --project <name>`,
and a single file by appending its path.

## Rules

- **Coverage is 100% on all four metrics.** A new branch needs a test or the run
  fails. Find what is missing in `coverage/lcov.info` (`DA:…,0`, `BRDA:…,0`),
  not in the text table.
- **React Native Testing Library 14 is async**: `await render(...)`,
  `await fireEvent(...)`. An un-awaited `fireEvent` leaks a pending `act` into
  the next test, whose render then resolves before its effects. Web DOM tests use
  `@testing-library/react`, which is synchronous.
- `vi.*` only. No `vi.isolateModules`: use `vi.resetModules` and a dynamic
  import. `vi.runOnlyPendingTimersAsync()` fires every pending timer regardless
  of when it is due; use `vi.advanceTimersByTimeAsync(ms)`.
- Take `unmount` from `render()`'s result; `screen.unmount()` leaves host refs
  set.
- `TurboModuleRegistry.get` returns an auto-mock for an unknown name, so a test
  that means "the library is absent" must `mockReturnValue(null)`.
- `@expo/ui` views render as `ViewManagerAdapter_ExpoUI_<View>View` host nodes.
  Helpers for finding them and reading modifiers are `expo-vitest/native`;
  Windows island helpers (`island`, `fireIsland`) are `expo-vitest/windows`; an
  in-memory Expo Router app is `expo-vitest/router`.
- On Windows, importing a module named in `NOT_ON_WINDOWS` (`vitest.config.mts`)
  throws: `@expo/ui`'s controls, `expo-image`, `expo-symbols` and the rest. If a
  test needs one, the kit's Windows file is wrong, not the guard.
- A fault in how a project is set up, rather than in a test, is `expo-vitest`'s:
  https://github.com/kat-tax/expo-vitest.

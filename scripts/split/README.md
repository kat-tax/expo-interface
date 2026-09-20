# Lifting the two packages out

`expo-vitest` and `expo-windows` were made to stand alone where they are: each
folder has its own dependencies, lint config, coverage gate, CI and docs, and
neither's code names the kit. So lifting one out is its folder's history as a
repository, plus the few lines that only make sense once it is one.

Everything here is local. Creating a repository on GitHub, pushing and
publishing are done by hand, in the order below, because each is public and
the first publish of a package cannot be undone.

## The order

`expo-vitest` first, since the other two depend on it. Then `expo-windows`.
The kit last.

1. **expo-vitest**

   ```sh
   scripts/split/extract.sh expo-vitest ../expo-vitest
   cd ../expo-vitest && bun install
   bun run typecheck && bun run lint && bun run test:coverage && bun run test:fixture
   git add -A && git commit      # the lockfile
   ```

   Create `kat-tax/expo-vitest`, push `master`. Publish the first version by
   hand (`npm login`, `npm publish --access public`, from a real terminal: the
   account asks for a one-time password). Then register the repository and its
   Release workflow as the package's trusted publisher on npmjs.com, so every
   later tag publishes itself.

2. **expo-windows**

   ```sh
   scripts/split/extract.sh expo-windows ../expo-windows
   cd ../expo-windows && bun install
   bun run typecheck && bun run lint && bun run test:coverage
   STOP_AFTER=bundle ci/build.sh <workdir>
   git add -A && git commit      # what makes it stand alone, and the lockfile
   ```

   Create `kat-tax/expo-windows`, push `master`, and watch its Windows workflow:
   that is the first full build of the probe app, and the first time its `Slot`
   layout is launched. Register this repository and its Release workflow as the
   trusted publisher of `expo-windows` on npmjs.com. It was never registered
   against the kit's repository, so there is nothing to move.

3. **The kit**

   ```sh
   node scripts/split/stand-alone.mjs expo-interface .
   bun install
   bun run typecheck && bun run lint && bun run test:coverage
   EXPO_WINDOWS_DIR=../expo-windows STOP_AFTER=bundle scripts/windows-ci.sh <workdir>
   ```

   That removes both folders and this one, and points the configs at the
   published `expo-vitest`. What it leaves for a person is prose: the workspace
   table and the testing and Windows rules in `AGENTS.md` and `.claude/rules/`,
   the testing section of `README.md`, and the links to the runtime's document
   and the harness's, which now live in the other two repositories.

## Rehearsing it

Before `expo-vitest` is on npm, the other two can depend on a tarball of it:

```sh
scripts/split/extract.sh expo-vitest ../_rehearsal/expo-vitest
(cd ../_rehearsal/expo-vitest && bun install && npm pack --pack-destination ..)
EXPO_VITEST=file:../expo-vitest-0.1.0.tgz scripts/split/extract.sh expo-windows ../_rehearsal/expo-windows
```

Rehearse from a short path. A path past Windows' length limit breaks module
resolution in ways that look like faults in the packages and are not.

## Two releases that go together

The aliases for `@expo/ui` and the community controls moved from the runtime to
the kit. A runtime after the move with a kit from before it has no `@expo/ui` on
Windows, and the reverse has the aliases twice, harmlessly. So the next kit and
the next runtime are released together, and the kit's notes say which runtime it
needs.

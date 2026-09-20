# The fixture

A library the size of one constant, with a file per platform and one test for
each rule a test file's name follows. Its manifest is what an app that tests
with `expo-vitest` has installed.

`bun run test:fixture` copies it to a folder outside the package, installs it
there from `bun.lock`, packs the package as `npm publish` would, unpacks that
into the copy's `node_modules`, names it in the copy's manifest, and runs these
tests against it by name. It is how the package is known to work installed,
which its source cannot say: Node will not strip types under `node_modules`,
Vitest leaves what is there out of its module graph unless told otherwise, and
the engine treats a dependency differently from the project it runs in.

After changing `package.json` here: `node scripts/fixture.js --update-lockfile`.

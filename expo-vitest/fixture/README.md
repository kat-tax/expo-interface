# The fixture

A library the size of one constant, with a file per platform and one test for
each rule a test file's name follows. `bun run test:fixture` builds the package,
packs it as `npm publish` would, unpacks that into `node_modules` here, and runs
these tests against it by its name. It is how the package is known to work
installed, which is the one place its source cannot say: Node will not strip
types under `node_modules`, and Vitest leaves what is there out of its module
graph unless told otherwise.

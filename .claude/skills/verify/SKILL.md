---
name: verify
description: Run the repository's full check loop — lint, typecheck across all four workspaces, and the Vitest projects with 100% coverage enforced. Use before reporting any work done, and to find what a failing coverage run is missing.
allowed-tools: [Bash(bun run *), Bash(node node_modules/*), Read, Grep]
---

# Verify

The whole loop, in the order that fails fastest:

```sh
bun run lint        # oxlint, zero warnings, whole repo
bun run typecheck   # tsc in root, expo-windows, example, storybook
bun run test        # every Vitest project
```

All three must pass before work is reported done. If one fails, fix it and run
that one again rather than the whole loop.

## Narrowing while iterating

```sh
node node_modules/oxlint/bin/oxlint --max-warnings 0 src/button          # one directory
node node_modules/typescript/bin/tsc --noEmit                            # root only, ~4s
node node_modules/typescript/bin/tsc --noEmit -p expo-windows/tsconfig.json
node node_modules/vitest/vitest.mjs run --project windows src/button     # one project, one path
```

Never reach for `npx tsc` — it resolves a bogus package in this repository.

## Coverage

```sh
bun run test:coverage
```

Thresholds are 100% on lines, branches, functions and statements, so a run can
pass every test and still fail. The text table rounds and will not tell you
where the hole is. Read the machine-readable report instead:

```sh
awk '/^SF:/{f=$0} /^DA:/{split($0,a,","); if(a[2]=="0") print f, $0} /^BRDA:/{split($0,a,","); if(a[4]=="0"||a[4]=="-") print f, $0}' coverage/lcov.info
```

`SF:` is the file, `DA:<line>,0` an uncovered line, `BRDA:<line>,<block>,<branch>,0`
an uncovered branch. Cover it with a test that means something; if the branch is
genuinely unreachable, delete it rather than test it.

## When the whole suite is slow

The suite is a few thousand tests across six projects and takes a couple of
minutes. Run it in the background and keep working, rather than narrowing so far
that a cross-platform regression slips through: the platform projects catch each
other's mistakes, which is the point of running all of them.

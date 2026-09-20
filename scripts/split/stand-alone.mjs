// What changes in a workspace once it is a repository of its own, and in the
// kit once the other two have left.
//
//   node scripts/split/stand-alone.mjs expo-vitest  <folder>
//   node scripts/split/stand-alone.mjs expo-windows <folder>
//   node scripts/split/stand-alone.mjs expo-interface <folder>
//
// The first two are run by extract.sh over a fresh clone of the split branch.
// The third is run over this repository itself, last, and is the end of it.
// Every edit names the exact text it replaces and stops if it is not there, so
// a file that has drifted since this was written fails loudly rather than
// being half changed.
import fs from 'node:fs';
import path from 'node:path';

const [target, folder = '.'] = process.argv.slice(2);
const root = path.resolve(folder);
/** What depends on `expo-vitest` names it as this: a range once it is published, a tarball's path before. */
const EXPO_VITEST = process.env.EXPO_VITEST ?? '^0.1.0';
const ORG = 'https://github.com/kat-tax';

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
}

function write(file, text) {
  fs.writeFileSync(path.join(root, file), text);
}

/** Replaces each `from` with its `to`, every occurrence, and fails if one is missing. */
function edit(file, swaps) {
  let text = read(file);
  for (const [from, to] of swaps) {
    if (!text.includes(from)) throw new Error(`${file}: expected to find: ${from.slice(0, 80)}`);
    text = text.split(from).join(to);
  }
  write(file, text);
  console.log(`  ${file}`);
}

/** A manifest, changed in place by `change` and written back with its two-space indent. */
function manifest(file, change) {
  const data = JSON.parse(read(file));
  change(data);
  write(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`  ${file}`);
}

function sorted(record) {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function remove(entry) {
  fs.rmSync(path.join(root, entry), {recursive: true, force: true});
  console.log(`  ${entry} (removed)`);
}

const targets = {
  // It was made to stand alone where it was, and needs nothing more.
  'expo-vitest'() {},

  'expo-windows'() {
    edit('vitest.projects.mts', [[`from '../expo-vitest/src/index.ts';`, `from 'expo-vitest';`]]);
    manifest('package.json', data => {
      data.homepage = `${ORG}/expo-windows#readme`;
      data.repository = {type: 'git', url: `git+${ORG}/expo-windows.git`};
      data.bugs = {url: `${ORG}/expo-windows/issues`};
      data.devDependencies = sorted({...data.devDependencies, 'expo-vitest': EXPO_VITEST});
    });
    edit('windows/ExpoWindows/ImageLoader.cpp', [[`(+${ORG}/expo-interface)`, `(+${ORG}/expo-windows)`]]);
  },

  'expo-interface'() {
    for (const entry of ['expo-windows', 'expo-vitest', 'scripts/split']) remove(entry);

    manifest('package.json', data => {
      data.workspaces = data.workspaces.filter(name => name !== 'expo-windows' && name !== 'expo-vitest');
      data.scripts.typecheck = 'tsc --noEmit && bun run --cwd example typecheck && bun run --cwd storybook typecheck';
      data.scripts.harness = 'expo-harness';
      delete data.scripts['test:fixture'];
      data.devDependencies = sorted({...data.devDependencies, 'expo-vitest': EXPO_VITEST});
    });

    edit('vitest.config.mts', [
      [`import path from 'node:path';\n`, ``],
      [`import {expoProjects, nodeProject} from './expo-vitest/src/index.ts';\nimport {runtimeProjects} from './expo-windows/vitest.projects.mts';\n`, `import {expoProjects} from 'expo-vitest';\n`],
      [`/** The \`expo-windows\` runtime's projects, which its own config runs alone (\`expo-windows/vitest.config.mts\`). */\nconst runtime = runtimeProjects(path.join(import.meta.dirname, 'expo-windows'));\n\n`, ``],
      [`    projects: [...expoProjects({windows: {forbid: NOT_ON_WINDOWS}}), ...runtime, vitest],`, `    projects: expoProjects({windows: {forbid: NOT_ON_WINDOWS}}),`],
      [`      include: ['src/**/*.{ts,tsx}', 'expo-windows/src/**/*.{ts,tsx}', 'expo-windows/{metro,cli}/**/*.js'],`, `      include: ['src/**/*.{ts,tsx}'],`],
      [`        'expo-windows/**/*.test.{js,ts,tsx}',\n        'expo-windows/**/*.d.ts',\n        'expo-windows/cli/index.js',\n`, ``],
    ]);
    // The block that made a Node project of expo-vitest's own tests, and the note that kept it out of coverage.
    write(
      'vitest.config.mts',
      read('vitest.config.mts')
        .replace(/\/\*\*\n \* The test layer's own logic:[\s\S]*?\nconst vitest = nodeProject\([^\n]*\n\n/, '')
        .replace(/        \/\/ `src\/\*\*` above matches any `src` folder\.[^\n]*\n[^\n]*\n        'expo-vitest\/\*\*',\n/, ''),
    );
    edit('vitest.config.device.mts', [[`from './expo-vitest/src/index.ts';`, `from 'expo-vitest';`]]);
    edit('storybook/.storybook/main.ts', [[`from '../../expo-vitest/src/metro-compat.ts';`, `from 'expo-vitest/metro-compat';`]]);
    edit('tsconfig.json', [[`,\n    "allowImportingTsExtensions": true,\n    "paths": {\n      "expo-vitest/*": ["./expo-vitest/src/*"]\n    }`, ``]]);
    edit('.oxlintrc.json', [[`        "**/*.test.tsx",\n        "vitest/**/*.ts",\n        "vitest/**/*.tsx",\n        "expo-vitest/src/**/*.ts",\n        "expo-vitest/src/**/*.tsx"`, `        "**/*.test.tsx"`]]);

    edit('scripts/windows-ci.sh', [
      [`RUNTIME="\${EXPO_WINDOWS_DIR:-$REPO/expo-windows}"`, `RUNTIME="\${EXPO_WINDOWS_DIR:-$REPO/../expo-windows}"`],
      [`# \`EXPO_WINDOWS_DIR\` names a checkout of the runtime other than the one beside\n# this script.`, `# \`EXPO_WINDOWS_DIR\` names a checkout of the runtime (${ORG}/expo-windows)\n# other than the one beside this repository.`],
    ]);

    edit('.github/workflows/ci.yml', [[
      `      - name: Test expo-vitest as an app installs it\n        # Packed, unpacked into a fixture's node_modules and run by name: the one\n        # place its source cannot speak for, since Node strips no types there.\n        run: bun run test:fixture\n`,
      ``,
    ]]);
    edit('.github/workflows/release.yml', [
      [`      - name: Publish expo-interface\n        run: bash .github/publish.sh .\n      - name: Publish expo-windows\n        run: bash .github/publish.sh expo-windows\n`, `      - name: Publish\n        run: bash .github/publish.sh .\n`],
    ]);
    write(
      '.github/workflows/release.yml',
      read('.github/workflows/release.yml').replace(
        /# Publishes both packages when a `v\*` tag is pushed\.\n#\n[\s\S]*?\n#\n# Publishing is npm trusted publishing/,
        '# Publishes the package when a `v*` tag is pushed. The tag must match\n# `package.json`\'s version.\n#\n# Publishing is npm trusted publishing',
      ),
    );
    write('.github/workflows/windows.yml', KIT_WINDOWS_WORKFLOW);
    console.log('  .github/workflows/windows.yml');

    // What was written about the two while they lived here: links become the other repositories', and the
    // paragraphs that described three things in one repository describe one.
    const RUNTIME_DOC = `${ORG}/expo-windows/blob/master/docs/expo-windows.md`;
    const HARNESS_DOC = `${ORG}/expo-vitest/blob/master/HARNESS.md`;
    edit('README.md', [
      [`[The expo-windows document](expo-windows/docs/expo-windows.md) describes the Windows\nplatform runtime that lives in this repository.`, `[The expo-windows document](${RUNTIME_DOC})\ndescribes the Windows platform runtime the kit runs on there.`],
      [`[expo-windows](expo-windows/README.md)`, `[expo-windows](${ORG}/expo-windows)`],
      [`plus the runtime's two projects. The projects, the test helpers and the\nharness are the [\`expo-vitest\`](expo-vitest/README.md) workspace. A file's name\ndecides where it runs:`, `through [\`expo-vitest\`](${ORG}/expo-vitest), which makes the projects and has\nthe test helpers and the harness. A file's name decides where it runs:`],
      [`reads. See [expo-vitest/HARNESS.md](expo-vitest/HARNESS.md).`, `reads. It is \`expo-vitest\`'s: see [its guide](${HARNESS_DOC}).`],
      [`- **Windows** (\`windows.yml\`), on changes to the kit, the runtime or the\n  example: the runtime's probe app and the example, each built end to end on\n  the react-native-windows line the template ships, plus the newest preview,\n  allowed to fail. \`scripts/windows-ci.sh\` is the example's build.`, `- **Windows** (\`windows.yml\`), on changes to the kit or the example: the\n  example built end to end over a checkout of \`expo-windows\`, on the\n  react-native-windows line the template ships, plus the newest preview,\n  allowed to fail. \`scripts/windows-ci.sh\` is that build.`],
    ]);
    edit('docs/expo-interface.md', [
      [`](../expo-windows/docs/expo-windows.md#versions)`, `](${RUNTIME_DOC}#versions)`],
      [`](../expo-windows/docs/expo-windows.md#setup)`, `](${RUNTIME_DOC}#setup)`],
      [`- The harness (\`expo-vitest/HARNESS.md\`) opens a route`, `- \`expo-vitest\`'s harness opens a route`],
    ]);
    edit('example/README.md', [[`](../expo-windows/docs/expo-windows.md)`, `](${RUNTIME_DOC})`]]);
    edit('storybook/docs/guides/windows.mdx', [[`${ORG}/expo-interface/blob/master/expo-windows/docs/expo-windows.md`, RUNTIME_DOC]]);
    edit('scripts/windows-ci.sh', [[`# ships. The road is the runtime's (\`expo-windows/ci/build.sh\`: a scratch app`, `# ships. The road is the runtime's (\`ci/build.sh\` in expo-windows: a scratch app`]]);

    edit('AGENTS.md', [
      [`Windows. Five workspaces:`, `Windows. What is here:`],
      [`| \`expo-windows/\` | the Windows platform runtime for Expo apps, published as \`expo-windows\` |\n| \`expo-vitest/\` | the per-platform Vitest projects, the test helpers and the harness, as the \`expo-vitest\` package |\n`, ``],
      [`| \`storybook/\` | two Storybooks (web and on-device) over \`src/**/*.stories.tsx\` |\n`, `| \`storybook/\` | two Storybooks (web and on-device) over \`src/**/*.stories.tsx\` |\n\nTwo things the kit stands on are repositories of their own: \`expo-windows\`\n(${ORG}/expo-windows), the Windows platform runtime, and \`expo-vitest\`\n(${ORG}/expo-vitest), which makes the per-platform Vitest projects and has\nthe test helpers and the harness.\n`],
      [`bun run typecheck   # tsc across all five workspaces`, `bun run typecheck   # tsc across the kit, the example and the Storybooks`],
      [`See \`expo-vitest/HARNESS.md\`.`, `See ${HARNESS_DOC}.`],
      [`line by \`expo-windows/ci/build.sh\`, which CI runs on every push: once for the\nruntime's own probe app, and once for the example through\n\`scripts/windows-ci.sh\`.`, `line by the runtime's build script, which \`scripts/windows-ci.sh\` runs over the\nexample on every push.`],
    ]);
    edit('.claude/rules/testing.md', [
      [`  - "expo-vitest/**"\n`, ``],
      [`Vitest 4 with \`vitest-expo\`, no jest. The projects come from the \`expo-vitest\`\nworkspace: \`vitest.config.mts\` calls \`expoProjects()\` for the kit's four, takes\nthe runtime's two from \`expo-windows/vitest.projects.mts\`, and adds a Node\nproject for \`expo-vitest\`'s own tests. **A file's name decides which platforms\nrun it**:`, `Vitest 4 with \`vitest-expo\`, no jest. The four projects come from the\n\`expo-vitest\` package: \`vitest.config.mts\` calls \`expoProjects()\`. **A file's\nname decides which platforms run it**:`],
      [`| \`expo-windows/src/**/*.test.{ts,tsx}\` | the runtime project (RN engine) |\n| \`expo-windows/{metro,cli}/**/*.test.{js,ts}\` | the node project |\n| \`expo-vitest/src/**/*.test.ts\` | the test layer's own node project |\n`, ``],
      [`and a single file by appending its path. The runtime's suite also runs alone,\nwith its own coverage gate: \`bun run --cwd expo-windows test:coverage\`.\n\`bun run test:fixture\` packs \`expo-vitest\` and runs its fixture against the\ninstalled copy; run it after changing anything under \`expo-vitest/\`.`, `and a single file by appending its path.`],
      [`- \`expo-vitest\` runs from source here and is imported by path in config files.\n  Its imports carry the \`.ts\` extension, because Node runs the harness from\n  source and the build rewrites them.`, `- A fault in how a project is set up, rather than in a test, is \`expo-vitest\`'s:\n  ${ORG}/expo-vitest.`],
    ]);
    edit('.claude/rules/windows.md', [
      [`  - "expo-windows/**"\n`, ``],
      [`  - "expo-windows/ci/**"\n`, ``],
      [`\`expo-windows/ci/build.sh <workdir>\` is the whole road: scratch app, \`init\`,\nautolink, bundle, Debug, Release, package, the Windows App Runtime, and a smoke\nlaunch that reports cold start and working set. It is what CI runs, and the\nfastest way to prove a change end to end. On its own it builds the runtime's\nprobe (\`expo-windows/ci/app\`, plain React Native, no kit).\n\`scripts/windows-ci.sh <workdir>\` is the same road for the example: it hands the\nruntime's script the example's source, this checkout's kit to overlay, and the\nroute that draws \`@expo/ui\` through the kit's aliases.`, `\`scripts/windows-ci.sh <workdir>\` is the whole road for the example: scratch app,\n\`init\`, autolink, bundle, Debug, Release, package, the Windows App Runtime, and a\nsmoke launch that reports cold start and working set. It is what CI runs, and\nthe fastest way to prove a change end to end. The road itself is the runtime's,\n\`ci/build.sh\` in a checkout of \`expo-windows\` (\`EXPO_WINDOWS_DIR\`, beside this\nrepository unless said): this script hands it the example's source, this\ncheckout's kit to overlay, and the route that draws \`@expo/ui\` through the kit's\naliases.`],
      [`\`STOP_AFTER=bundle\` stops either once the bundle is written`, `\`STOP_AFTER=bundle\` stops it once the bundle is written`],
      [`Specs live in \`src/windows/specs/\` (the kit) and \`expo-windows/src/windows/specs/\`\n(the runtime). Run`, `Specs live in \`src/windows/specs/\`. Run`],
    ]);
  },
};

/** The kit's Windows build once the runtime is elsewhere: check the runtime out beside it, and build the example over it. */
const KIT_WINDOWS_WORKFLOW = `name: Windows

# Builds the example for Windows end to end on the line react-native-windows
# ships (0.84 while Expo 57's React Native 0.86 waits for a 0.86 line). The road
# is the runtime's, ${ORG}/expo-windows: its build script over the example's
# source, with this checkout's kit in its node_modules. See scripts/windows-ci.sh.
#
# The runtime is checked out at \`runtime-ref\`, \`master\` unless a run is asked
# for another: the branch a change to both was made on, or a released tag.

on:
  push:
    branches: [master]
    paths:
      - 'src/**'
      - 'windows/**'
      - 'example/**'
      - 'scripts/windows-ci/**'
      - 'scripts/windows-ci.sh'
      - '.github/workflows/windows.yml'
  pull_request:
    paths:
      - 'src/**'
      - 'windows/**'
      - 'example/**'
      - 'scripts/windows-ci/**'
      - 'scripts/windows-ci.sh'
      - '.github/workflows/windows.yml'
  workflow_dispatch:
    inputs:
      runtime-ref:
        description: The branch, tag or commit of expo-windows to build over
        default: master

concurrency:
  group: windows-\${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  build:
    name: The example (react-native-windows \${{ matrix.line.rnw }})
    runs-on: windows-latest
    timeout-minutes: 90
    strategy:
      fail-fast: false
      matrix:
        line:
          - {rn: '', rnw: '0.84 (the template)', cli: '20.1.0', preview: false}
          - {rn: '0.85.3', rnw: '0.85.0-preview.1', cli: '20.2.0', preview: true}
    continue-on-error: \${{ matrix.line.preview }}
    steps:
      - uses: actions/checkout@v7
      - name: Check the runtime out beside the kit
        uses: actions/checkout@v7
        with:
          repository: kat-tax/expo-windows
          ref: \${{ inputs.runtime-ref || 'master' }}
          path: _runtime
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - uses: microsoft/setup-msbuild@v2
      - name: Cache the scratch app's npm store
        uses: actions/cache@v6
        with:
          path: ~\\AppData\\Local\\npm-cache
          key: npm-windows-ci-\${{ hashFiles('_runtime/ci/app/package.json') }}
          restore-keys: npm-windows-ci-
      - name: Build
        shell: bash
        run: scripts/windows-ci.sh "$RUNNER_TEMP/winci"
        env:
          EXPO_WINDOWS_DIR: \${{ github.workspace }}/_runtime
          RN_VERSION: \${{ matrix.line.rn }}
          RNW_VERSION: \${{ matrix.line.rn && matrix.line.rnw || '' }}
          CLI_VERSION: \${{ matrix.line.cli }}
      - name: Upload the app and the bundle
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: windows-app-\${{ matrix.line.cli }}-\${{ matrix.line.preview && 'preview' || 'stable' }}
          path: |
            \${{ runner.temp }}/winci/WinCi/windows/x64/*/*.exe
            \${{ runner.temp }}/winci/WinCi/windows/*/Bundle
            \${{ runner.temp }}/winci/WinCi/windows/AppPackages/*/*.msix
            \${{ runner.temp }}/winci/WinCi/windows/AppPackages/*/*.cer
          if-no-files-found: ignore
          retention-days: 7
`;

if (!targets[target]) {
  console.error(`which one? ${Object.keys(targets).join(', ')}`);
  process.exit(1);
}
console.log(`${target}, standing alone in ${root}:`);
targets[target]();

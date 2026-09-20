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

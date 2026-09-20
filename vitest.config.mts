import type {Plugin} from 'vite';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {configDefaults, defineConfig} from 'vitest/config';
import {vitestExpoProjects} from 'vitest-expo';
import {TEST_TIMEOUT} from './vitest/timeout';

/**
 * The kit resolves a different implementation per platform (`index.ios.tsx`,
 * `index.android.tsx`, `index.windows.tsx`, `index.web.tsx` / `index.tsx`),
 * so the suite runs once per platform as four Vitest projects (`vitest-expo`,
 * Metro-style resolution). Test files pick their platforms by name:
 *
 * - `*.test.ts`             every platform, including Windows
 * - `*.test.tsx`            iOS, Android and web
 * - `*.native.test.tsx`     iOS and Android
 * - `*.ios.test.tsx`        iOS only
 * - `*.android.test.tsx`    Android only
 * - `*.web.test.tsx`        web only
 * - `*.windows.test.tsx`    Windows only
 *
 * Windows runs on the iOS engine (vitest-native has no Windows one) with the
 * platform told it is Windows and `.windows.*` files resolved first — see
 * `vitest/setup.windows.ts`.
 */
const OTHER_PLATFORMS = {
  ios: ['**/*.web.test.*', '**/*.android.test.*', '**/*.windows.test.*'],
  android: ['**/*.web.test.*', '**/*.ios.test.*', '**/*.windows.test.*'],
};

const SOURCE = path.resolve(import.meta.dirname, 'src');
const RUNTIME_SOURCE = path.resolve(import.meta.dirname, 'expo-windows', 'src');

/**
 * Resolves a relative import from the kit's source (or the runtime's) to its
 * Windows platform file when there is one — `../button` to `button/index.windows.tsx`, the
 * way Metro does for the `windows` platform — ahead of the iOS order
 * vitest-native gives Vite (which the Node side keeps for React Native's own
 * files: they have no Windows variants outside react-native-windows).
 */
const windowsResolution: Plugin = {
  name: 'expo-interface:windows-resolution',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || !source.startsWith('.')) return null;
    const from = path.resolve(importer);
    if (!from.startsWith(SOURCE) && !from.startsWith(RUNTIME_SOURCE)) return null;
    if (/\.[cm]?[jt]sx?$/.test(source)) return null;
    const base = path.resolve(path.dirname(importer), source);
    for (const extension of ['.tsx', '.ts']) {
      for (const candidate of [`${base}.windows${extension}`, path.join(base, `index.windows${extension}`)]) {
        if (existsSync(candidate)) return candidate;
      }
    }
    return null;
  },
};

// `expo-modules-core`, `@expo/ui` and `@expo/dom-webview` ship TypeScript
// sources as their entry points. Node's loader cannot type-strip inside
// node_modules, so keep them in the Vite module graph (inline) where they are
// transformed like app code.
const TS_SOURCE_PACKAGES = [/[\\/]expo-modules-core[\\/]/, /[\\/]@expo[\\/]ui[\\/]/, /[\\/]@expo[\\/]dom-webview[\\/]/];
const TRANSFORM_PACKAGES = ['expo-modules-core', '@expo/ui', '@expo/dom-webview'];

const projects = vitestExpoProjects({
  jestCompat: false,
  platforms: ['ios', 'android'],
  transformPackages: TRANSFORM_PACKAGES,
}).map(project => {
  const platform = project.test.name as 'ios' | 'android';
  return {
    ...project,
    test: {
      ...project.test,
      globals: true,
      clearMocks: true,
      testTimeout: TEST_TIMEOUT,
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: [...configDefaults.exclude, ...OTHER_PLATFORMS[platform]],
      setupFiles: ['./vitest/setup.native.ts'],
      server: {deps: {inline: TS_SOURCE_PACKAGES}},
    },
  };
});

const [iosProject] = vitestExpoProjects({
  jestCompat: false,
  platforms: ['ios'],
  transformPackages: TRANSFORM_PACKAGES,
});

const windowsProject = {
  ...iosProject,
  plugins: [windowsResolution, ...iosProject.plugins],
  test: {
    ...iosProject.test,
    name: 'windows',
    globals: true,
    clearMocks: true,
    testTimeout: TEST_TIMEOUT,
    include: ['src/**/*.windows.test.{ts,tsx}', 'src/**/*.test.ts'],
    // A platform's own `.ts` test is still a `*.test.ts`, so the shared
    // pattern above would pull `foo.web.test.ts` in here and run it with no
    // DOM. Every other platform names its exclusions; this one has to as well.
    exclude: [...configDefaults.exclude, '**/*.web.test.*', '**/*.ios.test.*', '**/*.android.test.*', '**/*.native.test.*'],
    setupFiles: ['./vitest/setup.windows.ts'],
    server: {deps: {inline: TS_SOURCE_PACKAGES}},
  },
};

/**
 * The `expo-windows` runtime's own JavaScript — the modules an Expo package
 * finds on Windows — tested on the same engine as the kit's Windows files;
 * its Metro config and CLI are Node code and run as a plain Node project.
 */
const runtimeProject = {
  ...windowsProject,
  // The runtime's aliases put the kit's components under other packages' names.
  resolve: {alias: {'expo-interface': path.join(SOURCE, 'index.ts')}},
  test: {
    ...windowsProject.test,
    name: 'expo-windows',
    testTimeout: TEST_TIMEOUT,
    include: ['expo-windows/src/**/*.test.{ts,tsx}'],
    // The platform without the kit's forbidden-module guard: the runtime's
    // tests import the Expo packages to prove they load on Windows.
    setupFiles: ['./vitest/platform.windows.ts'],
  },
};

/**
 * The harness's own logic — the snapshot shape every platform answers in, the
 * selector matching a test targets with, and the PNG comparison behind
 * `toMatchScreenshot`. Pure Node, no device: the tests that need one live in
 * the opt-in `device` project (`vitest.config.device.mts`).
 */
const harnessProject = {
  test: {
    name: 'harness',
    testTimeout: TEST_TIMEOUT,
    environment: 'node',
    globals: true,
    clearMocks: true,
    include: ['scripts/harness/**/*.test.ts'],
  },
};

const runtimeNodeProject = {
  test: {
    name: 'expo-windows-node',
    testTimeout: TEST_TIMEOUT,
    environment: 'node',
    globals: true,
    clearMocks: true,
    include: ['expo-windows/{metro,cli}/**/*.test.{js,ts}'],
  },
};

export default defineConfig({
  test: {
    // Web needs a different pipeline (react-native-web in jsdom with the
    // dependency optimizer pre-bundling the Expo packages) — see the file.
    projects: [...projects, windowsProject, runtimeProject, runtimeNodeProject, harnessProject, './vitest.config.web.mts'],
    // Terminal output plus the browsable report (`@vitest/ui`) in test-report/.
    reporters: ['default', 'html'],
    outputFile: {html: 'test-report/index.html'},
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text-summary', 'html', 'lcov'],
      thresholds: {lines: 100, functions: 100, branches: 100, statements: 100},
      include: ['src/**/*.{ts,tsx}', 'expo-windows/src/**/*.{ts,tsx}', 'expo-windows/{metro,cli}/**/*.js'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/__stories__/**',
        'src/__tests__/**',
        'src/**/*.d.ts',
        'expo-windows/**/*.test.{js,ts,tsx}',
        'expo-windows/**/*.d.ts',
        'expo-windows/cli/index.js',
      ],
    },
  },
});

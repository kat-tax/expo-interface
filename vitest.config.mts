import {defineConfig} from 'vitest/config';
import {expoProjects, nodeProject} from './expo-vitest/src/index.ts';

/**
 * The kit resolves a different implementation per platform (`index.ios.tsx`,
 * `index.android.tsx`, `index.windows.tsx`, `index.web.tsx` / `index.tsx`),
 * so the suite runs once per platform as four Vitest projects. `expo-vitest`
 * makes them, and a test file picks its platforms by name:
 *
 * - `*.test.ts`             every platform, including Windows
 * - `*.test.tsx`            iOS, Android and web
 * - `*.native.test.tsx`     iOS and Android
 * - `*.ios.test.tsx`        iOS only
 * - `*.android.test.tsx`    Android only
 * - `*.web.test.tsx`        web only
 * - `*.windows.test.tsx`    Windows only
 */

/**
 * The modules with no Windows implementation, which must never load there:
 * `@expo/ui` (nothing of it exists on Windows) and the Expo packages whose
 * module calls `requireNativeModule` at import and throws without the native
 * side. Importing one kills an app before its first render. What is not here
 * is what a Windows app does have: `expo-router` (the navigation UI) and the
 * modules the `expo-windows` runtime provides, `expo-constants` and
 * `expo-linking`, which Expo Router itself loads. `src/index.windows.test.ts`
 * imports the whole barrel under this rule.
 */
const NOT_ON_WINDOWS = [
  '@expo/ui',
  '@expo/ui/swift-ui',
  '@expo/ui/swift-ui/modifiers',
  '@expo/ui/jetpack-compose',
  '@expo/ui/jetpack-compose/modifiers',
  'expo-asset',
  'expo-image',
  'expo-status-bar',
  'expo-symbols',
  'expo-symbols/androidWeights/regular',
  'expo-system-ui',
  'expo-web-browser',
  'react-native-keyboard-controller',
];

/**
 * The `expo-windows` runtime's own JavaScript, the modules an Expo package
 * finds on Windows, runs on the Windows project's engine without the kit's
 * forbidden modules: its tests import the Expo packages to prove they load.
 * Its Metro config and CLI are Node code and run as a plain Node project.
 */
const runtime = [
  ...expoProjects({platforms: ['windows'], windows: {name: 'expo-windows', include: ['expo-windows/src/**/*.test.{ts,tsx}']}}),
  nodeProject({name: 'expo-windows-node', include: ['expo-windows/{metro,cli}/**/*.test.{js,ts}']}),
];

/**
 * The harness's own logic: the snapshot shape every platform answers in, the
 * selector matching a test targets with, and the PNG comparison behind
 * `toMatchScreenshot`. Pure Node, no device: the tests that need one live in
 * the opt-in `device` project (`vitest.config.device.mts`).
 */
const harness = nodeProject({name: 'harness', include: ['scripts/harness/**/*.test.ts']});

/** The test projects' own logic: the file names each platform takes, the two resolver plugins. */
const vitest = nodeProject({name: 'expo-vitest', include: ['expo-vitest/src/**/*.test.ts']});

export default defineConfig({
  test: {
    projects: [...expoProjects({windows: {forbid: NOT_ON_WINDOWS}}), ...runtime, harness, vitest],
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
        'src/**/*.d.ts',
        'expo-windows/**/*.test.{js,ts,tsx}',
        'expo-windows/**/*.d.ts',
        'expo-windows/cli/index.js',
        // `src/**` above matches any `src` folder. The test layer's own tests run
        // here, but its setup files and Node hooks are not something a unit test reaches.
        'expo-vitest/**',
      ],
    },
  },
});

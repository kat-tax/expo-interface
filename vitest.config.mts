import {defineConfig} from 'vitest/config';
import {expoProjects} from 'expo-vitest';

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

export default defineConfig({
  test: {
    projects: expoProjects({windows: {forbid: NOT_ON_WINDOWS}}),
    // Terminal output plus the browsable report (`@vitest/ui`) in test-report/.
    reporters: ['default', 'html'],
    outputFile: {html: 'test-report/index.html'},
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text-summary', 'html', 'lcov'],
      thresholds: {lines: 100, functions: 100, branches: 100, statements: 100},
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/__stories__/**',
        'src/**/*.d.ts',
      ],
    },
  },
});

import {configDefaults, defineConfig} from 'vitest/config';
import {vitestExpoProjects} from 'vitest-expo';

/**
 * The kit resolves a different implementation per platform (`index.ios.tsx`,
 * `index.android.tsx`, `index.web.tsx` / `index.tsx`), so the suite runs once
 * per platform as three Vitest projects (`vitest-expo`, Metro-style
 * resolution). Test files pick their platforms by name:
 *
 * - `*.test.ts(x)`          every platform
 * - `*.native.test.tsx`     iOS and Android
 * - `*.ios.test.tsx`        iOS only
 * - `*.android.test.tsx`    Android only
 * - `*.web.test.tsx`        web only
 */
const OTHER_PLATFORMS = {
  ios: ['**/*.web.test.*', '**/*.android.test.*'],
  android: ['**/*.web.test.*', '**/*.ios.test.*'],
};

// `expo-modules-core` and `@expo/ui` ship TypeScript sources as their entry
// points. Node's loader cannot type-strip inside node_modules, so keep them in
// the Vite module graph (inline) where they are transformed like app code.
const TS_SOURCE_PACKAGES = [/[\\/]expo-modules-core[\\/]/, /[\\/]@expo[\\/]ui[\\/]/];

const projects = vitestExpoProjects({
  jestCompat: false,
  platforms: ['ios', 'android'],
  transformPackages: ['expo-modules-core', '@expo/ui'],
}).map(project => {
  const platform = project.test.name as 'ios' | 'android';
  return {
    ...project,
    test: {
      ...project.test,
      globals: true,
      clearMocks: true,
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: [...configDefaults.exclude, ...OTHER_PLATFORMS[platform]],
      setupFiles: ['./vitest/setup.native.ts'],
      server: {deps: {inline: TS_SOURCE_PACKAGES}},
    },
  };
});

export default defineConfig({
  test: {
    // Web needs a different pipeline (react-native-web in jsdom with the
    // dependency optimizer pre-bundling the Expo packages) — see the file.
    projects: [...projects, './vitest.config.web.mts'],
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
        'src/__tests__/**',
        'src/**/*.d.ts',
      ],
    },
  },
});

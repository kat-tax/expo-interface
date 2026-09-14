import type {Plugin} from 'vite';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {configDefaults, defineConfig} from 'vitest/config';
import {vitestExpoProjects} from 'vitest-expo';

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

/**
 * Resolves a relative import from the kit's source to its Windows platform
 * file when there is one — `../button` to `button/index.windows.tsx`, the
 * way Metro does for the `windows` platform — ahead of the iOS order
 * vitest-native gives Vite (which the Node side keeps for React Native's own
 * files: they have no Windows variants outside react-native-windows).
 */
const windowsResolution: Plugin = {
  name: 'expo-interface:windows-resolution',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || !source.startsWith('.') || !path.resolve(importer).startsWith(SOURCE)) return null;
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

const [iosProject] = vitestExpoProjects({
  jestCompat: false,
  platforms: ['ios'],
  transformPackages: ['expo-modules-core', '@expo/ui'],
});

const windowsProject = {
  ...iosProject,
  plugins: [windowsResolution, ...iosProject.plugins],
  test: {
    ...iosProject.test,
    name: 'windows',
    globals: true,
    clearMocks: true,
    include: ['src/**/*.windows.test.{ts,tsx}', 'src/**/*.test.ts'],
    exclude: [...configDefaults.exclude],
    setupFiles: ['./vitest/setup.windows.ts'],
    server: {deps: {inline: TS_SOURCE_PACKAGES}},
  },
};

export default defineConfig({
  test: {
    // Web needs a different pipeline (react-native-web in jsdom with the
    // dependency optimizer pre-bundling the Expo packages) — see the file.
    projects: [...projects, windowsProject, './vitest.config.web.mts'],
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

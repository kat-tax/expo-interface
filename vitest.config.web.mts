import {configDefaults, defineConfig} from 'vitest/config';
import {vitestExpo} from 'vitest-expo';
import {EXPO_WEB_PACKAGES, metroCompat} from './vitest/metro-compat';

export default defineConfig({
  plugins: [
    metroCompat(),
    vitestExpo({platform: 'web', jestCompat: false, transformPackages: ['expo-modules-core', '@expo/ui']}),
  ],
  resolve: {
    alias: [
      // `expo-router/ui` is an ESM stub (`export * from './build/ui'`) over a
      // CJS module. The optimizer cannot enumerate `export *` of CJS, so the
      // bundle ends up with no exports and Vite skips its CJS interop; point
      // at the CJS entry itself, which is wrapped as `default` + interop.
      {find: /^expo-router\/ui$/, replacement: 'expo-router/build/ui/index.js'},
    ],
  },
  test: {
    name: 'web',
    globals: true,
    clearMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, '**/*.native.test.*', '**/*.ios.test.*', '**/*.android.test.*'],
    setupFiles: ['./vitest/setup.web.ts'],
    deps: {
      optimizer: {
        client: {
          enabled: true,
          include: [...EXPO_WEB_PACKAGES, 'expo-router/testing-library', 'expo-router/build/ui/index.js'],
          rolldownOptions: {plugins: [metroCompat()]},
        },
      },
    },
  },
});

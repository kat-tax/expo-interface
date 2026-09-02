import {configDefaults, defineConfig} from 'vitest/config';
import {vitestExpo} from 'vitest-expo';
import {EXPO_WEB_PACKAGES, metroCompat} from './vitest/metro-compat';

export default defineConfig({
  plugins: [
    metroCompat(),
    vitestExpo({platform: 'web', jestCompat: false, transformPackages: ['expo-modules-core', '@expo/ui']}),
  ],
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
          include: [...EXPO_WEB_PACKAGES, 'expo-router/testing-library'],
          rolldownOptions: {plugins: [metroCompat()]},
        },
      },
    },
  },
});

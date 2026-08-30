import fs from 'node:fs';
import path from 'node:path';
import type {Plugin} from 'vite';
import {configDefaults, defineConfig} from 'vitest/config';
import {vitestExpo} from 'vitest-expo';

const NODE_MODULES = /[\\/]node_modules[\\/]/;
const METRO_EXTENSIONS = ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'];
const EMPTY_AMBIENT = '\0expo-interface:empty-ambient';

/**
 * Metro-isms the Vite/rolldown resolver lacks, for the Expo packages that the
 * dependency optimizer pre-bundles on web:
 *
 * - Metro appends source extensions even when the specifier already looks like
 *   it has one (`import './Asset.fx'` → `Asset.fx.js` in expo-asset); Vite
 *   treats `.fx` as the extension and gives up.
 * - `expo-modules-core/src/ts-declarations/global` imports `declare class`
 *   types as values (they only exist ambiently); Babel/Metro strips the file
 *   to nothing, so serve an empty module.
 */
function metroCompat(): Plugin {
  return {
    name: 'expo-interface:metro-compat',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (/ts-declarations[\\/]global$/.test(source)) return EMPTY_AMBIENT;
      if (!importer || source === EMPTY_AMBIENT) return null;
      // Resolve normally first, then prefer the platform twin like Metro does
      // (`ensureNativeModulesAreInstalled.ts` → `.web.ts`, which installs the
      // JS core behind `globalThis.expo`).
      const resolved = await this.resolve(source, importer, {skipSelf: true});
      if (resolved && !resolved.external) {
        const [file, query] = resolved.id.split('?');
        if (NODE_MODULES.test(file) && !/\.web\./.test(file)) {
          const base = file.replace(/\.([cm]?jsx?|tsx?)$/, '');
          // The twin may use a different extension (`resolveAssetSource.tsx`
          // next to `resolveAssetSource.web.ts` in expo-image).
          for (const ext of ['.web.ts', '.web.tsx', '.web.js', '.web.jsx', '.web.mjs', '.web.cjs']) {
            if (base !== file && fs.existsSync(base + ext)) {
              return query ? `${base}${ext}?${query}` : base + ext;
            }
          }
        }
        return resolved;
      }
      // Metro appends extensions even past an apparent extension (`./Asset.fx`).
      if (!source.startsWith('.') || !NODE_MODULES.test(importer)) return null;
      const base = path.resolve(path.dirname(importer), source);
      for (const ext of METRO_EXTENSIONS) {
        if (fs.existsSync(base + ext)) return base + ext;
      }
      return null;
    },
    load(id) {
      if (id === EMPTY_AMBIENT) return 'export {};';
      return null;
    },
  };
}

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
          include: [
            'expo',
            'expo-router',
            'expo-router/testing-library',
            'expo-asset',
            'expo-modules-core',
            'expo-constants',
            'expo-linking',
            'expo-font',
            'expo-status-bar',
            'expo-system-ui',
            'expo-symbols',
            'expo-image',
            'expo-web-browser',
            '@expo/ui',
            'react-native-safe-area-context',
            'react-native-screens',
          ],
          rolldownOptions: {plugins: [metroCompat()]},
        },
      },
    },
  },
});

import type {Plugin} from 'vite';
import path from 'node:path';

/**
 * `react-native` → `react-native-shim.js`, which re-exports react-native-web
 * plus the native-only names the kit imports. Registered from a plugin
 * `config` hook rather than `resolve.alias` in `viteFinal`: this plugin runs
 * after vite-plugin-rnw's, and later aliases take precedence in Vite's config
 * merge, so it beats rnw's `react-native` → `react-native-web` alias.
 *
 * Also points `expo-router/ui` at its CommonJS build: the package's `ui.js`
 * is `export * from './build/ui'` over CommonJS, which rolldown pre-bundles
 * as an empty module; the CommonJS entry gets a proper interop instead.
 */
export function reactNativeShim(configDir: string): Plugin {
  return {
    name: 'expo-interface:react-native-shim',
    config: () => ({
      resolve: {
        alias: [
          {find: /^react-native$/, replacement: path.resolve(configDir, 'react-native-shim.js')},
          // bun hoists every dependency to the root `node_modules`.
          {find: /^expo-router\/ui$/, replacement: path.resolve(configDir, '../../node_modules/expo-router/build/ui/index.js')},
        ],
      },
      optimizeDeps: {needsInterop: ['expo-router/ui']},
    }),
  };
}

/** Where `main.ts` `staticDirs` serves `@expo-google-fonts/material-symbols`. */
export const MATERIAL_SYMBOLS_URL = '/fonts/material-symbols';

const FONT_FILE = /\.(ttf|otf|woff2?)$/;
const FONT_ID = '\0expo-interface:font:';

/**
 * `expo-symbols` renders Material Symbols on web with the font from
 * `@expo-google-fonts/material-symbols`, which reads it Metro-style:
 * `require('./MaterialSymbols_400Regular.ttf')`. Metro turns that into an
 * asset URL; Vite/rolldown cannot, so resolve those requires to the URL the
 * font is served at (relative, so the site works under a sub-path). Runs in
 * the dependency optimizer and the build alike.
 */
export function materialSymbolsFont(configDir: string): Plugin {
  const root = path.resolve(configDir, '../../node_modules/@expo-google-fonts/material-symbols');
  return {
    name: 'expo-interface:material-symbols-font',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.') || !FONT_FILE.test(source)) return null;
      const rel = path.relative(root, path.resolve(path.dirname(importer), source));
      if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
      return FONT_ID + rel.split(path.sep).join('/');
    },
    load(id) {
      if (!id.startsWith(FONT_ID)) return null;
      // CommonJS shape, since the package reads the asset with `require()`.
      return `module.exports = ${JSON.stringify(`.${MATERIAL_SYMBOLS_URL}/${id.slice(FONT_ID.length)}`)};`;
    },
  };
}

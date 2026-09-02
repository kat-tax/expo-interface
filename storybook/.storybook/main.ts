import type {StorybookConfig} from '@storybook/react-native-web-vite';
import path from 'node:path';
import remarkGfm from 'remark-gfm';
import {EXPO_WEB_PACKAGES, metroCompat} from '../../vitest/metro-compat.ts';
import {MATERIAL_SYMBOLS_URL, materialSymbolsFont, reactNativeShim} from './vite-plugins.ts';

/**
 * Web Storybook: Vite + react-native-web, so the docs site gets the full
 * Storybook manager (MDX pages, autodocs, theming). iOS and Android use the
 * on-device Storybook in `.rnstorybook` through Metro instead.
 */
const main: StorybookConfig = {
  stories: ['../docs/**/*.mdx', '../../src/**/*.stories.?(ts|tsx)'],
  addons: [
    // Runs the stories as Vitest browser tests (`../vitest.config.mts`) and
    // adds the testing widget to the sidebar.
    '@storybook/addon-vitest',
    {
      name: '@storybook/addon-docs',
      options: {
        // GitHub-flavored markdown (tables) in the MDX guides.
        mdxPluginOptions: {mdxCompileOptions: {remarkPlugins: [remarkGfm]}},
      },
    },
  ],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {},
  },
  // The Material Symbols font that `expo-symbols` loads on web (see
  // `materialSymbolsFont`); bun hoists it to the root `node_modules`.
  staticDirs: [{from: '../../node_modules/@expo-google-fonts/material-symbols', to: MATERIAL_SYMBOLS_URL}],
  core: {disableTelemetry: true},
  async viteFinal(config, {configDir}) {
    const {mergeConfig} = await import('vite');
    return mergeConfig(config, {
      // `expo-interface` resolves to the package source (the tsconfig path
      // only covers TS files; MDX pages import it too).
      resolve: {alias: {'expo-interface': path.resolve(configDir, '../../src/index.ts')}},
      plugins: [
        // Same Metro-compat pipeline as the Vitest web project: the Expo
        // packages are pre-bundled with Metro's resolution quirks patched.
        metroCompat(),
        materialSymbolsFont(configDir),
        reactNativeShim(configDir),
      ],
      optimizeDeps: {
        include: EXPO_WEB_PACKAGES,
        rolldownOptions: {
          plugins: [metroCompat(), materialSymbolsFont(configDir)],
          // Files without a `.web` twin import native-only names from
          // `react-native` that react-native-web lacks (`expo-symbols`
          // imports `PlatformColor` and only calls it on Android). Metro
          // tolerates that; rolldown treats it as a build error unless
          // shimmed, which vite-plugin-rnw already does for `storybook build`.
          shimMissingExports: true,
        },
      },
    });
  },
};

export default main;

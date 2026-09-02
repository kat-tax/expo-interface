import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import {storybookTest} from '@storybook/addon-vitest/vitest-plugin';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs every story of the web Storybook as a Vitest test in headless
 * Chromium (`@storybook/addon-vitest`): each story mounts through the
 * `.storybook/preview.tsx` decorators, its play function runs, and a render
 * error fails the test. The plugin applies `.storybook/main.ts` itself
 * (`viteFinal`, the Metro-compat pipeline), so no Vite config is repeated
 * here. Separate from the root Vitest projects, which unit-test the package
 * per platform: `bun run storybook:test`, or the testing widget in
 * `storybook dev`.
 */
export default defineConfig({
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook'),
      storybookScript: 'bun run web --ci',
      storybookUrl: 'http://localhost:6006',
    }),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      provider: playwright({}),
      headless: true,
      instances: [{browser: 'chromium'}],
    },
  },
});

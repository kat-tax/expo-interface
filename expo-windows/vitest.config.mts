import {defineConfig} from 'vitest/config';
import {runtimeProjects} from './vitest.projects.mts';

/** The runtime's suite on its own: `vitest run` from this folder. */
export default defineConfig({
  test: {
    projects: runtimeProjects(import.meta.dirname),
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text-summary', 'html', 'lcov'],
      thresholds: {lines: 100, functions: 100, branches: 100, statements: 100},
      include: ['src/**/*.{ts,tsx}', '{metro,cli}/**/*.js'],
      // The command's entry point parses arguments and calls what is tested.
      exclude: ['**/*.test.{js,ts,tsx}', '**/*.d.ts', 'cli/index.js'],
    },
  },
});

import {defineConfig} from 'vitest/config';
import {nodeProject} from './src/index.ts';

/**
 * The package's own logic, in Node: the file names each platform takes, the
 * two resolver plugins, and the harness's snapshot shape, selector matching
 * and PNG comparison. What needs an engine, a browser or a device is proved by
 * the fixture (`bun run test:fixture`) and by device tests, not from here.
 */
export default defineConfig({
  test: {
    projects: [nodeProject({name: 'expo-vitest', include: ['src/**/*.test.ts']})],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text-summary', 'html', 'lcov'],
      // The files that are logic and nothing else are held to all of it. A setup
      // file, a Node require hook and a device driver are not what a unit test
      // reaches, and a number for them would say nothing.
      include: ['src/projects.ts', 'src/forbid-modules.ts', 'src/windows-resolution.ts', 'src/timeout.ts'],
      thresholds: {lines: 100, functions: 100, branches: 100, statements: 100},
    },
  },
});

import {defineConfig} from 'vitest/config';

/**
 * The device project: tests that drive a real build of the app and read what it
 * actually rendered, rather than what a component renders in isolation.
 *
 * It is deliberately not part of `bun run test`. It needs an app running
 * somewhere — a web server, a simulator, a built exe — so it is opt-in:
 *
 *   HARNESS_PLATFORM=web HARNESS_URL=http://localhost:8085 bun run test:device
 *   HARNESS_PLATFORM=windows HARNESS_TARGET=<path to the exe> bun run test:device
 *
 * These tests are the layer the component suite cannot reach: a whole app,
 * its own Babel configuration, a real renderer. A completely broken web build
 * once passed 2029 component tests, which is what this exists to catch.
 */
export default defineConfig({
  test: {
    name: 'device',
    globals: true,
    environment: 'node',
    include: ['device/**/*.test.ts'],
    setupFiles: ['./vitest/device/matchers.ts'],
    // A real app, a real renderer: slower than a component test by a lot, and
    // one device cannot be driven by two tests at once.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // One app, one driver: two files must not press the same window at once.
    fileParallelism: false,
    pool: 'forks',
    maxForks: 1,
    minForks: 1,
  },
});

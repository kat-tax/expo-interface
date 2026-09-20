import {defineConfig} from 'vitest/config';
import {deviceConfig} from './expo-vitest/src/index.ts';

/**
 * The device project: tests that drive a real build of the app and read what it
 * actually rendered, rather than what a component renders in isolation.
 *
 * It is deliberately not part of `bun run test`. It needs an app running
 * somewhere (a web server, a simulator, a built exe), so it is opt-in:
 *
 *   HARNESS_PLATFORM=web HARNESS_URL=http://localhost:8085 bun run test:device
 *   HARNESS_PLATFORM=windows HARNESS_TARGET=<path to the exe> bun run test:device
 *
 * These tests are the layer the component suite cannot reach: a whole app,
 * its own Babel configuration, a real renderer. A completely broken web build
 * once passed 2029 component tests, which is what this exists to catch.
 */
export default defineConfig(deviceConfig());

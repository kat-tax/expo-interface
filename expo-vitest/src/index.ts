/**
 * Vitest for Expo code on every platform it runs on.
 *
 * - `expoProjects()` makes one Vitest project for iOS, Android, web and
 *   Windows, and a test file's name decides which of them run it.
 * - `expo-vitest/native`, `expo-vitest/windows` and `expo-vitest/router` are
 *   helpers for the tests: the payload `@expo/ui` hands SwiftUI and Compose, a
 *   Windows native component's props and events, an in-memory Expo Router app.
 * - `expo-vitest/device` drives a running app and reads its accessibility
 *   tree, on the harness the `expo-harness` command is the other face of.
 */
export type {ExpoProjectsOptions, Platform} from './projects.ts';
export {deviceConfig, expoProjects, nodeProject} from './projects.ts';
export {forbidModules} from './forbid-modules.ts';
export {EXPO_WEB_PACKAGES, metroCompat} from './metro-compat.ts';
export {TEST_TIMEOUT} from './timeout.ts';
export {windowsResolution} from './windows-resolution.ts';

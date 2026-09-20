/**
 * Vitest for Expo code on every platform it runs on.
 *
 * - `expoProjects()` makes one Vitest project for iOS, Android, web and
 *   Windows, and a test file's name decides which of them run it.
 */
export type {ExpoProjectsOptions, Platform} from './projects.ts';
export {expoProjects, nodeProject} from './projects.ts';
export {forbidModules} from './forbid-modules.ts';
export {EXPO_WEB_PACKAGES, metroCompat} from './metro-compat.ts';
export {TEST_TIMEOUT} from './timeout.ts';
export {windowsResolution} from './windows-resolution.ts';

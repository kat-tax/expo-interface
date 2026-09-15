/**
 * expo-windows: the runtime that gives an Expo app a Windows platform.
 *
 * An app uses three things from it. `expo-windows/metro` (`withWindows`)
 * in `metro.config.js` makes Metro serve the platform. `expo-windows/src/install`
 * — which `withWindows` runs before the app's entry — installs Expo Modules
 * Core's global and the Windows modules behind `requireNativeModule`. And
 * the `expo-windows` CLI writes, builds and runs the `windows/` project.
 * Nothing here is imported by app code.
 */
export {registerModule, registeredModules} from './modules/registry';
export {registerModules} from './modules';
export {uuidv4} from './uuid';

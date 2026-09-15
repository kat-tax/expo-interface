import {installExpoGlobalPolyfill} from 'expo-modules-core/src/polyfill/dangerous-internal';
import {installUuidFallback} from './uuid';
import {registerModules} from './modules';

/**
 * Runs before the app's main module — `withWindows` adds this file to Metro's
 * list of modules run before the entry, right after React Native's own
 * `InitializeCore` — and gives the Windows bundle what Expo's native
 * platforms get from their host: the `expo` global.
 *
 * Expo Modules Core has two implementations of every entry point. The native
 * one expects the host to have installed `globalThis.expo` — `NativeModule`
 * is read from it at import time — and the web one installs a JavaScript
 * version of the same global: `EventEmitter`, `NativeModule`, `SharedObject`
 * and a `modules` registry that `requireNativeModule` reads first on every
 * platform. Windows installs that version, then registers its modules in the
 * registry, so `requireNativeModule('ExpoLinking')` finds a Windows module
 * where iOS would find a Swift one.
 *
 * Nothing imported here touches the global at import time: the polyfill's
 * own module only defines the classes, and the runtime's modules take
 * `NativeModule` from the global when they are created, below.
 */
// React Native's fetch, before Expo's lazy polyfill takes the global (see `winter-fetch.ts`).
(globalThis as {__expoWindowsFetch?: typeof globalThis.fetch}).__expoWindowsFetch ??= globalThis.fetch;
installExpoGlobalPolyfill();
installUuidFallback();
registerModules();

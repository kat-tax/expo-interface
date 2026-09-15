import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';

/**
 * Puts a module where Expo Modules Core looks first on every platform:
 * `globalThis.expo.modules[name]`, which `requireNativeModule` and
 * `requireOptionalNativeModule` read before any native proxy. A module
 * already there is kept, so a second install changes nothing.
 */
export function registerModule(name: string, module: object): void {
  const expo = globalThis.expo;
  if (!expo) {
    throw new Error(`expo-windows: the expo global is not installed, so ${name} cannot be registered; install runs first`);
  }
  expo.modules ??= {};
  expo.modules[name] ??= module;
}

/** The names registered so far, for a diagnostic or a test. */
export function registeredModules(): string[] {
  return Object.keys(globalThis.expo?.modules ?? {});
}

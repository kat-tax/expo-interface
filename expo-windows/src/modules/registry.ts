import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';

/**
 * Puts a module where Expo Modules Core looks first on every platform:
 * `globalThis.expo.modules[name]`, which `requireNativeModule` and
 * `requireOptionalNativeModule` read before any native proxy. A module
 * already there is kept, so a second install changes nothing. A module
 * that is one of the core's own (`NativeModule`, with its listeners) is
 * marked with its name, as the core marks the ones it registers: the
 * packages still on the core's legacy emitter (`expo-notifications`) then
 * listen to the module itself instead of wrapping it in React Native's
 * emitter, which on Windows subscribes elsewhere and tells the module an
 * event's name without a listener.
 */
export function registerModule(name: string, module: object): void {
  const expo = globalThis.expo;
  if (!expo) {
    throw new Error(`expo-windows: the expo global is not installed, so ${name} cannot be registered; install runs first`);
  }
  if (expo.NativeModule && module instanceof expo.NativeModule) {
    Object.defineProperty(module, '__expo_module_name__', {value: name, configurable: true});
  }
  expo.modules ??= {};
  expo.modules[name] ??= module;
}

/** The names registered so far, for a diagnostic or a test. */
export function registeredModules(): string[] {
  return Object.keys(globalThis.expo?.modules ?? {});
}

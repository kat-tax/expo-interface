import type {NativeModule} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';

/**
 * The `NativeModule` class a Windows module extends, taken from the `expo`
 * global at the time the module is created rather than imported — importing
 * it from `expo-modules-core` would read the global at import time, before
 * the install has put it there.
 */
export function nativeModuleClass(): typeof NativeModule {
  const expo = globalThis.expo;
  if (!expo?.NativeModule) {
    throw new Error('expo-windows: the expo global is not installed, so no module can be created; install runs first');
  }
  return expo.NativeModule as typeof NativeModule;
}

/**
 * The error Expo Modules Core throws for a method a platform does not have,
 * in its own words and with its code, without importing the package at
 * module load.
 */
export class UnavailabilityError extends Error {
  readonly code = 'ERR_UNAVAILABLE';

  constructor(moduleName: string, propertyName: string) {
    super(`The method or property ${moduleName}.${propertyName} is not available on windows, are you sure you've linked all the native dependencies properly?`);
    this.name = 'UnavailabilityError';
  }
}

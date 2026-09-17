import type {NativeSecureStore} from '../native';
import {native, unwrap} from '../native';
import {UnavailabilityError} from './base';

export type SecureStoreOptions = {
  keychainService?: string;
  requireAuthentication?: boolean;
  authenticationPrompt?: string;
};

/** The keychain accessibility constants, which name iOS behaviours; Windows keeps them as names. */
export const KEYCHAIN_ACCESSIBILITY = {
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  ALWAYS: 'ALWAYS',
  ALWAYS_THIS_DEVICE_ONLY: 'ALWAYS_THIS_DEVICE_ONLY',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
};

export const DEFAULT_SERVICE = 'default';

function library(method: string): NativeSecureStore {
  const store = native.secureStore();
  if (!store) throw new UnavailabilityError('SecureStore', method);
  return store;
}

const service = (options?: SecureStoreOptions): string => options?.keychainService || DEFAULT_SERVICE;

/** The store, after Windows Hello when the value requires the user's presence. */
async function verified(method: string, options?: SecureStoreOptions): Promise<NativeSecureStore> {
  const store = library(method);
  if (options?.requireAuthentication) {
    const verified = await store.verify(options.authenticationPrompt ?? 'Verify it is you');
    if (!verified) throw Object.assign(new Error(`SecureStore.${method}: the user did not verify themselves`), {code: 'ERR_SECURESTORE_AUTH_FAILED'});
  }
  return store;
}

/** The store, for a synchronous call — which cannot wait for Windows Hello. */
function unverified(method: string, options?: SecureStoreOptions): NativeSecureStore {
  if (options?.requireAuthentication) {
    throw new Error(`SecureStore.${method} cannot require authentication on Windows: the asynchronous call asks Windows Hello`);
  }
  return library(method);
}

async function getValueWithKeyAsync(key: string, options?: SecureStoreOptions): Promise<string | null> {
  return unwrap((await verified('getItemAsync', options)).getValue(key, service(options)));
}

/**
 * `ExpoSecureStore`, what `expo-secure-store` keeps its values through:
 * each value encrypted for the current Windows user with DPAPI and kept as
 * a file of the app's local data, under the `keychainService` as a folder.
 * A value that `requireAuthentication` guards is read or written only after
 * Windows Hello has verified the user (the asynchronous calls; the
 * synchronous ones cannot wait for a prompt). Whether Windows Hello is set
 * up is what `canUseBiometricAuthentication` answers. The package takes
 * the presence of `getValueWithKeyAsync` as availability, so it is there
 * only with the runtime's library in the app.
 */
export const ExpoSecureStore = {
  ...KEYCHAIN_ACCESSIBILITY,
  get getValueWithKeyAsync(): typeof getValueWithKeyAsync | undefined {
    return native.secureStore() ? getValueWithKeyAsync : undefined;
  },
  async setValueWithKeyAsync(value: string, key: string, options?: SecureStoreOptions): Promise<void> {
    unwrap((await verified('setItemAsync', options)).setValue(value, key, service(options)));
  },
  async deleteValueWithKeyAsync(key: string, options?: SecureStoreOptions): Promise<void> {
    unwrap((await verified('deleteItemAsync', options)).deleteValue(key, service(options)));
  },
  getValueWithKeySync(key: string, options?: SecureStoreOptions): string | null {
    return unwrap(unverified('getItem', options).getValue(key, service(options)));
  },
  setValueWithKeySync(value: string, key: string, options?: SecureStoreOptions): void {
    unwrap(unverified('setItem', options).setValue(value, key, service(options)));
  },
  canUseBiometricAuthentication(): boolean {
    return native.secureStore()?.canVerify() ?? false;
  },
};

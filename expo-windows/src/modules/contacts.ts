import {DENIED, type PermissionResponse} from './permissions';

async function denied(): Promise<PermissionResponse> {
  return DENIED;
}

/** The base of the package's `Contact`: an id, and nothing a store would fill in. */
export class Contact {
  constructor(readonly id: string) {}
}

/**
 * `ExpoContacts`, the legacy module of `expo-contacts`, and
 * `ExpoContactsNext`, its current one. The contacts store on Windows is for
 * packaged apps, which an unpackaged app is not, so the permissions are
 * denied — the package guards every other call on its own, as on web — and
 * the change listeners never fire.
 */
export const ExpoContacts = {
  getPermissionsAsync: denied,
  requestPermissionsAsync: denied,
};

export const ExpoContactsNext = {
  Contact,
  getPermissionsAsync: denied,
  requestPermissionsAsync: denied,
  addListener(): {remove(): void} {
    return {remove() {}};
  },
  removeListener(): void {},
  removeAllListeners(): void {},
  emit(): void {},
  listenerCount(): number {
    return 0;
  },
};

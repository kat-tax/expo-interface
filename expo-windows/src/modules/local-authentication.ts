import {native} from '../native';

/** `expo-local-authentication`'s `AuthenticationType`. */
const FINGERPRINT = 1;
const FACIAL_RECOGNITION = 2;

/** `expo-local-authentication`'s `SecurityLevel`. */
const NONE = 0;
const SECRET = 1;

/** The package's error for each answer Windows Hello gives short of `Verified`. */
const ERRORS: Record<string, string> = {
  Canceled: 'user_cancel',
  DeviceNotPresent: 'not_available',
  NotConfiguredForUser: 'not_enrolled',
  DisabledByPolicy: 'not_available',
  DeviceBusy: 'unable_to_process',
  RetriesExhausted: 'lockout',
};

export type LocalAuthenticationResult = {success: true} | {success: false; error: string; warning?: string};

/** The words of a rejection: an `Error`'s, a native rejection's (`{code, message}`), or the value's own. */
function messageOf(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) return String((error as {message: unknown}).message);
  return String(error);
}

export interface ExpoLocalAuthenticationModule {
  hasHardwareAsync?(): Promise<boolean>;
  isEnrolledAsync?(): Promise<boolean>;
  supportedAuthenticationTypesAsync?(): Promise<number[]>;
  getEnrolledLevelAsync?(): Promise<number>;
  authenticateAsync?(options: {promptMessage?: string}): Promise<LocalAuthenticationResult>;
}

/**
 * `ExpoLocalAuthentication`, what `expo-local-authentication` asks, over
 * Windows Hello through the runtime's library: there is hardware when the
 * verifier is not "device not present", the user is enrolled when it is
 * available, and `authenticateAsync` asks for a verification for the app's
 * window with the prompt. Windows Hello does not say which of a face, a
 * fingerprint or a PIN is set up, so both biometric types are listed where
 * there is hardware and the enrolled level is the secret's, the least it
 * may be. Cancelling from the app is Android's. Without the library the
 * methods are absent, as the package reads availability.
 */
export function createLocalAuthenticationModule(): ExpoLocalAuthenticationModule {
  const library = native.localAuthentication();
  if (!library) return {};
  const availability = () => library.checkAvailability();
  return {
    async hasHardwareAsync() {
      return (await availability()) !== 'DeviceNotPresent';
    },
    async isEnrolledAsync() {
      return (await availability()) === 'Available';
    },
    async supportedAuthenticationTypesAsync() {
      return (await availability()) === 'DeviceNotPresent' ? [] : [FINGERPRINT, FACIAL_RECOGNITION];
    },
    async getEnrolledLevelAsync() {
      return (await availability()) === 'Available' ? SECRET : NONE;
    },
    async authenticateAsync(options) {
      try {
        const result = await library.verify(options.promptMessage ?? 'Authenticate');
        if (result === 'Verified') return {success: true};
        return {success: false, error: ERRORS[result] ?? 'unknown'};
      } catch (error) {
        return {success: false, error: 'unknown', warning: messageOf(error)};
      }
    },
  };
}

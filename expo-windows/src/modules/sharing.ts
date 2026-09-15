import {UnavailabilityError} from './base';

/**
 * `ExpoSharing`, what `expo-sharing` shares through. Windows has a share
 * sheet (`DataTransferManager`), but reaching it takes a C++ module that
 * comes in a later release; until then sharing reports itself unavailable,
 * which is what `Sharing.isAvailableAsync` is for, and `shareAsync` throws
 * the error the package documents. Received shares are not a Windows
 * concept at all.
 */
export const ExpoSharing = {
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  async shareAsync(_url: string, _options: object = {}): Promise<void> {
    throw new UnavailabilityError('Sharing', 'shareAsync');
  },
  getSharedPayloads(): never {
    throw new UnavailabilityError('Sharing', 'getSharedPayloads');
  },
  async getResolvedSharedPayloadsAsync(): Promise<never> {
    throw new UnavailabilityError('Sharing', 'getResolvedSharedPayloadsAsync');
  },
  clearSharedPayloads(): void {},
};

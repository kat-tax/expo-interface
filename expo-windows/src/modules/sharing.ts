import {native} from '../native';
import {UnavailabilityError} from './base';

/**
 * `ExpoSharing`, what `expo-sharing` shares through. With the runtime's
 * Windows library in the app, `shareAsync` opens the share sheet
 * (`DataTransferManager`) with the file, titled by `dialogTitle`; without
 * it sharing reports itself unavailable, which is what
 * `Sharing.isAvailableAsync` is for, and `shareAsync` throws the error the
 * package documents. Received shares are not a Windows concept at all.
 */
export const ExpoSharing = {
  async isAvailableAsync(): Promise<boolean> {
    return (await native.sharing()?.isAvailable()) ?? false;
  },
  async shareAsync(url: string, options: {dialogTitle?: string; mimeType?: string; UTI?: string} = {}): Promise<void> {
    const sharing = native.sharing();
    if (!sharing) throw new UnavailabilityError('Sharing', 'shareAsync');
    await sharing.share(url, options.dialogTitle ?? '');
  },
  getSharedPayloads(): never {
    throw new UnavailabilityError('Sharing', 'getSharedPayloads');
  },
  async getResolvedSharedPayloadsAsync(): Promise<never> {
    throw new UnavailabilityError('Sharing', 'getResolvedSharedPayloadsAsync');
  },
  clearSharedPayloads(): void {},
};

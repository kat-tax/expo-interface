import {UnavailabilityError} from './base';

/**
 * `ExpoStoreReview`, what `expo-store-review` asks. Windows has no in-app
 * review prompt, so the feature is unavailable; `requestReview` then falls
 * back to the store URL the config names, as the package does on every
 * platform without the prompt.
 */
export const ExpoStoreReview = {
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  async requestReview(): Promise<never> {
    throw new UnavailabilityError('StoreReview', 'requestReview');
  },
};

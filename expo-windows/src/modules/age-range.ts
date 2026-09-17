/**
 * `ExpoAgeRange`, what `expo-age-range` asks. Windows has no age signal an
 * app can read, so the answers are the package's own for a platform without
 * one: an adult range, and nothing known for the rest.
 */
export const ExpoAgeRange = {
  async requestAgeRangeAsync(): Promise<{lowerBound: number; upperBound: null}> {
    return {lowerBound: 18, upperBound: null};
  },
  async isEligibleForAgeFeaturesAsync(): Promise<null> {
    return null;
  },
  async showSignificantUpdateAcknowledgmentAsync(): Promise<void> {},
  async getRequiredRegulatoryFeaturesAsync(): Promise<null> {
    return null;
  },
  async requestAgeSignalsAccessAsync(): Promise<null> {
    return null;
  },
  setFakeAgeSignals(): void {},
};

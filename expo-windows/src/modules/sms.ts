/**
 * `ExpoSMS`, what `expo-sms` asks. Windows has no messaging app an app can
 * hand a text to, so the feature is unavailable; the package reports
 * `sendSMSAsync` unavailable itself when the member is absent.
 */
export const ExpoSMS = {
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
};

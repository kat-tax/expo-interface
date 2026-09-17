/**
 * `ExpoHaptics`, what `expo-haptics` plays through. A desktop has nothing to
 * vibrate, so every call completes without effect — an app's feedback code
 * runs the same on Windows without a branch, which is what the package's
 * web module gives a browser without the vibration API.
 */
export const ExpoHaptics = {
  async impactAsync(): Promise<void> {},
  async notificationAsync(): Promise<void> {},
  async selectionAsync(): Promise<void> {},
  async performHapticsAsync(): Promise<void> {},
};

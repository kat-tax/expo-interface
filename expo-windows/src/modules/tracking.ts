/**
 * `ExpoTrackingTransparency`, what `expo-tracking-transparency` reads. The
 * prompt is iOS's, and the package answers the permission calls itself off
 * iOS; what it asks the platform for is the advertising id, which Windows
 * does not give an app.
 */
export const ExpoTrackingTransparency = {
  getAdvertisingId(): null {
    return null;
  },
};

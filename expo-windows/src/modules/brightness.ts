import {DENIED, type PermissionResponse} from './permissions';

/**
 * `ExpoBrightness`, what `expo-brightness` asks. A desktop's monitors are
 * not the app's to dim, so the permission is denied and the feature — which
 * the package detects by the presence of `getBrightnessAsync` — absent.
 */
export const ExpoBrightness = {
  async getPermissionsAsync(): Promise<PermissionResponse> {
    return DENIED;
  },
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    return DENIED;
  },
};

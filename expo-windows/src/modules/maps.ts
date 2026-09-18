import type {PermissionResponse} from './permissions';
import {native} from '../native';
import {DENIED, GRANTED} from './permissions';

const UNDETERMINED: PermissionResponse = {status: 'undetermined', expires: 'never', granted: false, canAskAgain: true};

/**
 * `ExpoMaps`, what `expo-maps` asks beside its views: the location
 * permission, as the system grants the app's use of location through
 * the runtime's location library (the map's own is another platform's);
 * denied without the library.
 */
export const ExpoMaps = {
  async getPermissionsAsync(): Promise<PermissionResponse> {
    const library = native.location();
    if (!library) return DENIED;
    const access = await library.requestAccess();
    return access === 'Allowed' ? GRANTED : access === 'Denied' ? DENIED : UNDETERMINED;
  },
  requestPermissionsAsync(): Promise<PermissionResponse> {
    return ExpoMaps.getPermissionsAsync();
  },
};

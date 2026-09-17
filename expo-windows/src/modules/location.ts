import type {EmitterSubscription} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import type {NativeLocation, NativeLocationObject} from '../native';
import type {PermissionResponse} from './permissions';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass, UnavailabilityError} from './base';
import {DENIED, GRANTED} from './permissions';
import {unavailableMethod} from './unavailable';

/** `expo-location`'s `Accuracy`, as the meters the geolocator is asked for. */
const ACCURACY_METERS: Record<number, number> = {1: 3000, 2: 1000, 3: 100, 4: 10, 5: 1, 6: 1};

const UNDETERMINED: PermissionResponse = {status: 'undetermined', expires: 'never', granted: false, canAskAgain: true};

/** What the package's own code guards with its unavailability error: other platforms' services. */
const OTHER_PLATFORMS = [
  'enableNetworkProviderAsync',
  'geocodeAsync',
  'reverseGeocodeAsync',
  'startLocationUpdatesAsync',
  'stopLocationUpdatesAsync',
  'hasStartedLocationUpdatesAsync',
  'startGeofencingAsync',
  'stopGeofencingAsync',
  'hasStartedGeofencingAsync',
  'watchMotionActivityImplAsync',
] as const;

export type LocationOptions = {accuracy?: number; timeInterval?: number; distanceInterval?: number; mayShowUserSettingsDialog?: boolean};
export type LastKnownOptions = {maxAge?: number; requiredAccuracy?: number};

type LocationEvents = {
  'Expo.locationChanged'(event: {watchId: number; location: NativeLocationObject}): void;
  'Expo.headingChanged'(event: {watchId: number; heading: {trueHeading: number | null; magHeading: number; accuracy: number}}): void;
  'Expo.locationError'(event: {watchId: number; reason: string}): void;
};

export interface ExpoLocationModule extends InstanceType<NativeModule<LocationEvents>> {
  getForegroundPermissionsAsync(): Promise<PermissionResponse>;
  requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
  requestPermissionsAsync(): Promise<PermissionResponse>;
  getBackgroundPermissionsAsync(): Promise<PermissionResponse>;
  requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
  getMotionActivityPermissionsAsync(): Promise<PermissionResponse>;
  requestMotionActivityPermissionsAsync(): Promise<PermissionResponse>;
  hasServicesEnabledAsync(): Promise<boolean>;
  getProviderStatusAsync(): Promise<{locationServicesEnabled: boolean; backgroundModeEnabled: boolean}>;
  getCurrentPositionAsync(options?: LocationOptions): Promise<NativeLocationObject>;
  getLastKnownPositionAsync(options?: LastKnownOptions): Promise<NativeLocationObject | null>;
  watchPositionImplAsync(watchId: number, options?: LocationOptions): Promise<void>;
  watchDeviceHeading(watchId: number): Promise<void>;
  removeWatchAsync(watchId: number): Promise<void>;
}

function permissionOf(access: Awaited<ReturnType<NativeLocation['requestAccess']>>): PermissionResponse {
  return access === 'Allowed' ? GRANTED : access === 'Denied' ? DENIED : UNDETERMINED;
}

function meters(options: LocationOptions | undefined): number {
  return ACCURACY_METERS[options?.accuracy ?? 3] ?? 100;
}

/**
 * `ExpoLocation`, what `expo-location` asks, over the runtime's location
 * library: the foreground permission as the system grants the app's use of
 * location (Windows asks the user in Settings, not the app; the background
 * and motion permissions are other platforms' and denied), whether the
 * service is on, a position at the accuracy asked, the last one kept for
 * `getLastKnownPositionAsync`, watches by id over the geolocator's
 * position events, and headings from the compass where there is one.
 * Geocoding, network providers, background updates, geofencing and motion
 * activity are other platforms' services, and throw the package's own
 * error. Without the library the permission is denied and the positions
 * unavailable.
 */
export function createLocationModule(): ExpoLocationModule {
  const Base = nativeModuleClass();
  class Module extends Base<LocationEvents> implements ExpoLocationModule {
    private subscriptions: EmitterSubscription[] = [];
    private last: NativeLocationObject | null = null;

    private library(): NativeLocation {
      const library = native.location();
      if (!library) throw new UnavailabilityError('Location', 'getCurrentPositionAsync');
      return library;
    }

    private async access(): Promise<PermissionResponse> {
      const library = native.location();
      return library ? permissionOf(await library.requestAccess()) : DENIED;
    }

    getForegroundPermissionsAsync(): Promise<PermissionResponse> {
      return this.access();
    }

    requestForegroundPermissionsAsync(): Promise<PermissionResponse> {
      return this.access();
    }

    requestPermissionsAsync(): Promise<PermissionResponse> {
      return this.access();
    }

    async getBackgroundPermissionsAsync(): Promise<PermissionResponse> {
      return DENIED;
    }

    async requestBackgroundPermissionsAsync(): Promise<PermissionResponse> {
      return DENIED;
    }

    async getMotionActivityPermissionsAsync(): Promise<PermissionResponse> {
      return DENIED;
    }

    async requestMotionActivityPermissionsAsync(): Promise<PermissionResponse> {
      return DENIED;
    }

    async hasServicesEnabledAsync(): Promise<boolean> {
      return (await this.access()).granted;
    }

    async getProviderStatusAsync(): Promise<{locationServicesEnabled: boolean; backgroundModeEnabled: boolean}> {
      return {locationServicesEnabled: await this.hasServicesEnabledAsync(), backgroundModeEnabled: false};
    }

    async getCurrentPositionAsync(options?: LocationOptions): Promise<NativeLocationObject> {
      const position = await this.library().getPosition(meters(options), 0, 30_000);
      this.last = position;
      return position;
    }

    async getLastKnownPositionAsync(options: LastKnownOptions = {}): Promise<NativeLocationObject | null> {
      const {last} = this;
      if (!last) return null;
      if (options.maxAge !== undefined && Date.now() - last.timestamp > options.maxAge) return null;
      if (options.requiredAccuracy !== undefined && last.coords.accuracy > options.requiredAccuracy) return null;
      return last;
    }

    async watchPositionImplAsync(watchId: number, options?: LocationOptions): Promise<void> {
      this.library().watch(watchId, options?.timeInterval ?? 1000, options?.distanceInterval ?? 0, meters(options));
    }

    watchDeviceHeading(watchId: number): Promise<void> {
      return this.library().watchHeading(watchId);
    }

    async removeWatchAsync(watchId: number): Promise<void> {
      native.location()?.stopWatch(watchId);
    }

    startObserving(): void {
      if (this.subscriptions.length) return;
      this.subscriptions = [
        DeviceEventEmitter.addListener('onLocationChanged', (event: {watchId: number; location: NativeLocationObject}) => {
          this.last = event.location;
          this.emit('Expo.locationChanged', event);
        }),
        DeviceEventEmitter.addListener('onHeadingChanged', (event: {watchId: number; heading: {trueHeading: number | null; magHeading: number; accuracy: number}}) => {
          this.emit('Expo.headingChanged', event);
        }),
        DeviceEventEmitter.addListener('onLocationError', (event: {watchId: number; reason: string}) => {
          this.emit('Expo.locationError', event);
        }),
      ];
    }

    stopObserving(): void {
      for (const subscription of this.subscriptions) subscription.remove();
      this.subscriptions = [];
    }
  }
  const module = new Module() as unknown as ExpoLocationModule & Record<string, unknown>;
  for (const name of OTHER_PLATFORMS) module[name] = unavailableMethod('Location', name);
  return module;
}

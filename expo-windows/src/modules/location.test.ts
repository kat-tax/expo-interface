import type {NativeLocationObject} from '../native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {createLocationModule} from './location';
import {DENIED, GRANTED} from './permissions';

const HERE: NativeLocationObject = {
  coords: {latitude: 51.5, longitude: -0.12, altitude: 30, accuracy: 25, altitudeAccuracy: null, heading: null, speed: null},
  timestamp: Date.now(),
  mocked: false,
};

function withLibrary(access: 'Allowed' | 'Denied' | 'Unspecified' = 'Allowed') {
  const library = {
    requestAccess: vi.fn(async () => access),
    getPosition: vi.fn(async () => HERE),
    watch: vi.fn(),
    watchHeading: vi.fn(async () => {}),
    stopWatch: vi.fn(),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsLocation' ? library : null) as never);
  return library;
}

describe('ExpoLocation (windows)', () => {
  it('answers the permissions from the system\'s access, and denies what is other platforms\'', async () => {
    withLibrary('Allowed');
    const module = createLocationModule();
    await expect(module.getForegroundPermissionsAsync()).resolves.toBe(GRANTED);
    await expect(module.requestForegroundPermissionsAsync()).resolves.toBe(GRANTED);
    await expect(module.requestPermissionsAsync()).resolves.toBe(GRANTED);
    await expect(module.hasServicesEnabledAsync()).resolves.toBe(true);
    await expect(module.getProviderStatusAsync()).resolves.toEqual({locationServicesEnabled: true, backgroundModeEnabled: false});
    await expect(module.getBackgroundPermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.requestBackgroundPermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.getMotionActivityPermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.requestMotionActivityPermissionsAsync()).resolves.toBe(DENIED);
    withLibrary('Denied');
    await expect(createLocationModule().getForegroundPermissionsAsync()).resolves.toBe(DENIED);
    withLibrary('Unspecified');
    await expect(createLocationModule().getForegroundPermissionsAsync()).resolves.toMatchObject({status: 'undetermined', canAskAgain: true});
  });

  it('asks the geolocator for a position at the accuracy asked, and keeps it as the last known', async () => {
    const library = withLibrary();
    const module = createLocationModule();
    await expect(module.getLastKnownPositionAsync()).resolves.toBeNull();
    await expect(module.getCurrentPositionAsync({accuracy: 4})).resolves.toBe(HERE);
    expect(library.getPosition).toHaveBeenCalledWith(10, 0, 30_000);
    await module.getCurrentPositionAsync();
    expect(library.getPosition).toHaveBeenLastCalledWith(100, 0, 30_000);
    await module.getCurrentPositionAsync({accuracy: 99});
    expect(library.getPosition).toHaveBeenLastCalledWith(100, 0, 30_000);
    await expect(module.getLastKnownPositionAsync()).resolves.toBe(HERE);
    await expect(module.getLastKnownPositionAsync({maxAge: 60_000, requiredAccuracy: 50})).resolves.toBe(HERE);
    await expect(module.getLastKnownPositionAsync({requiredAccuracy: 10})).resolves.toBeNull();
    await expect(module.getLastKnownPositionAsync({maxAge: -1})).resolves.toBeNull();
  });

  it('watches positions and headings by id over the library\'s events, and stops them', async () => {
    const library = withLibrary();
    const module = createLocationModule() as ReturnType<typeof createLocationModule> & {startObserving(): void; stopObserving(): void};
    const moved = vi.fn();
    const turned = vi.fn();
    const failed = vi.fn();
    module.addListener('Expo.locationChanged', moved);
    module.addListener('Expo.headingChanged', turned);
    module.addListener('Expo.locationError', failed);
    module.startObserving();
    module.startObserving();
    await module.watchPositionImplAsync(7, {timeInterval: 500, distanceInterval: 5, accuracy: 6});
    expect(library.watch).toHaveBeenCalledWith(7, 500, 5, 1);
    await module.watchPositionImplAsync(8);
    expect(library.watch).toHaveBeenLastCalledWith(8, 1000, 0, 100);
    await module.watchDeviceHeading(9);
    expect(library.watchHeading).toHaveBeenCalledWith(9);
    DeviceEventEmitter.emit('onLocationChanged', {watchId: 7, location: HERE});
    DeviceEventEmitter.emit('onHeadingChanged', {watchId: 9, heading: {trueHeading: 12, magHeading: 10, accuracy: 3}});
    DeviceEventEmitter.emit('onLocationError', {watchId: 7, reason: 'Location is turned off'});
    expect(moved).toHaveBeenCalledWith({watchId: 7, location: HERE});
    expect(turned).toHaveBeenCalledWith({watchId: 9, heading: {trueHeading: 12, magHeading: 10, accuracy: 3}});
    expect(failed).toHaveBeenCalledWith({watchId: 7, reason: 'Location is turned off'});
    // A watched position is the last known one too.
    await expect(module.getLastKnownPositionAsync()).resolves.toBe(HERE);
    await module.removeWatchAsync(7);
    expect(library.stopWatch).toHaveBeenCalledWith(7);
    module.stopObserving();
    module.stopObserving();
    DeviceEventEmitter.emit('onLocationChanged', {watchId: 8, location: HERE});
    expect(moved).toHaveBeenCalledTimes(1);
  });

  it('throws the package\'s error for other platforms\' services, and without the library', async () => {
    withLibrary();
    const module = createLocationModule() as ReturnType<typeof createLocationModule> & Record<string, () => never>;
    expect(() => module.geocodeAsync()).toThrow(/Location\.geocodeAsync/);
    expect(() => module.startGeofencingAsync()).toThrow(/Location\.startGeofencingAsync/);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const without = createLocationModule();
    await expect(without.getForegroundPermissionsAsync()).resolves.toBe(DENIED);
    await expect(without.hasServicesEnabledAsync()).resolves.toBe(false);
    await expect(without.getCurrentPositionAsync()).rejects.toThrow(/Location\.getCurrentPositionAsync/);
    await expect(without.watchPositionImplAsync(1)).rejects.toThrow(/not available on windows/);
    await expect(without.removeWatchAsync(1)).resolves.toBeUndefined();
  });
});

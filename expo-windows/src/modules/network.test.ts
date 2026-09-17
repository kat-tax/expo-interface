import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {createNetworkModule} from './network';

const WIFI = {type: 'WIFI', isConnected: true, isInternetReachable: true} as const;

describe('ExpoNetwork (windows)', () => {
  it('reads the state and the address through the library', async () => {
    const library = {getState: vi.fn(async () => WIFI), getIpAddress: vi.fn(async () => '192.168.1.20')};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsNetwork' ? library : null) as never);
    const module = createNetworkModule();
    await expect(module.getNetworkStateAsync?.()).resolves.toEqual(WIFI);
    await expect(module.getIpAddressAsync?.()).resolves.toBe('192.168.1.20');
    expect(module).not.toHaveProperty('isAirplaneModeEnabledAsync');
  });

  it('passes the system\'s status changes to its listeners while observed', () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createNetworkModule() as ReturnType<typeof createNetworkModule> & {startObserving(): void; stopObserving(): void};
    const listener = vi.fn();
    module.addListener('onNetworkStateChanged', listener);
    module.startObserving();
    module.startObserving();
    DeviceEventEmitter.emit('onNetworkStateChanged', WIFI);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(WIFI);
    module.stopObserving();
    module.stopObserving();
    DeviceEventEmitter.emit('onNetworkStateChanged', {type: 'NONE', isConnected: false, isInternetReachable: false});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('is absent, as the package reads availability, without the library', () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createNetworkModule();
    expect(module.getNetworkStateAsync).toBeUndefined();
    expect(module.getIpAddressAsync).toBeUndefined();
  });
});

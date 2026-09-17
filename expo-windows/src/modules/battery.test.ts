import type {PowerState} from '../native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {createBatteryModule} from './battery';

const CHARGING: PowerState = {hasBattery: true, level: 0.76, state: 'CHARGING', lowPowerMode: false};

function withPower(state: PowerState) {
  const power = {getState: vi.fn(() => state), setKeepAwake: vi.fn()};
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsPower' ? power : null) as never);
  return power;
}

describe('ExpoBattery (windows)', () => {
  it('reports the battery through the library, in the package\'s numbers', async () => {
    const power = withPower(CHARGING);
    const module = createBatteryModule();
    expect(module.isSupported).toBe(true);
    await expect(module.getBatteryLevelAsync()).resolves.toBe(0.76);
    await expect(module.getBatteryStateAsync()).resolves.toBe(2);
    await expect(module.isLowPowerModeEnabledAsync()).resolves.toBe(false);
    await expect(module.isBatteryOptimizationEnabledAsync()).resolves.toBe(false);
    power.getState.mockReturnValue({hasBattery: true, level: 1, state: 'FULL', lowPowerMode: true});
    await expect(module.getBatteryStateAsync()).resolves.toBe(3);
    await expect(module.isLowPowerModeEnabledAsync()).resolves.toBe(true);
    power.getState.mockReturnValue({hasBattery: true, level: 0.5, state: 'NOT_CHARGING', lowPowerMode: false});
    await expect(module.getBatteryStateAsync()).resolves.toBe(4);
    power.getState.mockReturnValue({hasBattery: true, level: 0.5, state: 'UNPLUGGED', lowPowerMode: false});
    await expect(module.getBatteryStateAsync()).resolves.toBe(1);
  });

  it('sends each of the package\'s events when its own value changes, while observed', () => {
    withPower(CHARGING);
    const module = createBatteryModule() as ReturnType<typeof createBatteryModule> & {startObserving(): void; stopObserving(): void};
    const level = vi.fn();
    const state = vi.fn();
    const mode = vi.fn();
    module.addListener('Expo.batteryLevelDidChange', level);
    module.addListener('Expo.batteryStateDidChange', state);
    module.addListener('Expo.powerModeDidChange', mode);
    module.startObserving();
    module.startObserving();
    DeviceEventEmitter.emit('onPowerChanged', {hasBattery: true, level: 0.75, state: 'CHARGING', lowPowerMode: false});
    expect(level).toHaveBeenCalledWith({batteryLevel: 0.75});
    expect(state).not.toHaveBeenCalled();
    expect(mode).not.toHaveBeenCalled();
    DeviceEventEmitter.emit('onPowerChanged', {hasBattery: true, level: 0.75, state: 'UNPLUGGED', lowPowerMode: true});
    expect(level).toHaveBeenCalledTimes(1);
    expect(state).toHaveBeenCalledWith({batteryState: 1});
    expect(mode).toHaveBeenCalledWith({lowPowerMode: true});
    module.stopObserving();
    module.stopObserving();
    DeviceEventEmitter.emit('onPowerChanged', {hasBattery: true, level: 0.1, state: 'UNPLUGGED', lowPowerMode: true});
    expect(level).toHaveBeenCalledTimes(1);
  });

  it('reports no battery without the library, as the package\'s web platform does', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createBatteryModule();
    expect(module.isSupported).toBe(false);
    await expect(module.getBatteryLevelAsync()).resolves.toBe(-1);
    await expect(module.getBatteryStateAsync()).resolves.toBe(0);
    await expect(module.isLowPowerModeEnabledAsync()).resolves.toBe(false);
  });
});

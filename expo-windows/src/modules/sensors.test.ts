import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {DENIED, GRANTED} from './permissions';
import {createSensorModule, createSensorModules, SENSORS} from './sensors';

function withSensors(available: string[] = ['accelerometer', 'pedometer']) {
  const sensors = {
    available: vi.fn((kind: string) => available.includes(kind)),
    start: vi.fn(),
    stop: vi.fn(),
    getStepCount: vi.fn(async () => 1234),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsSensors' ? sensors : null) as never);
  return sensors;
}

describe('expo-sensors modules (windows)', () => {
  it('makes one module per package name, with the device motion\'s gravity constant', () => {
    withSensors();
    const modules = createSensorModules();
    expect(Object.keys(modules).sort()).toEqual(SENSORS.map(sensor => sensor.name).sort());
    expect((modules.ExponentDeviceMotion as unknown as {Gravity: number}).Gravity).toBe(9.80665);
    expect(modules.ExponentAccelerometer).not.toHaveProperty('Gravity');
    expect(modules.ExponentPedometer.getStepCountAsync).toBeTypeOf('function');
    expect(modules.ExponentAccelerometer.getStepCountAsync).toBeUndefined();
  });

  it('says which sensors the machine has, and grants what Windows never gates', async () => {
    withSensors(['accelerometer']);
    const accelerometer = createSensorModule(SENSORS[0]);
    const gyroscope = createSensorModule(SENSORS[1]);
    await expect(accelerometer.isAvailableAsync()).resolves.toBe(true);
    await expect(gyroscope.isAvailableAsync()).resolves.toBe(false);
    await expect(accelerometer.getPermissionsAsync()).resolves.toBe(GRANTED);
    await expect(accelerometer.requestPermissionsAsync()).resolves.toBe(GRANTED);
  });

  it('starts the sensor at the interval set while listened to, passing its readings and no other\'s', () => {
    const sensors = withSensors();
    const module = createSensorModule(SENSORS[0]) as ReturnType<typeof createSensorModule> & {startObserving(): void; stopObserving(): void};
    const listener = vi.fn();
    module.addListener('accelerometerDidUpdate', listener);
    module.setUpdateInterval(16);
    expect(sensors.start).not.toHaveBeenCalled();
    module.startObserving();
    module.startObserving();
    expect(sensors.start.mock.calls).toEqual([['accelerometer', 16]]);
    DeviceEventEmitter.emit('onSensorReading', {kind: 'accelerometer', x: 0, y: 0, z: 1, timestamp: 5});
    DeviceEventEmitter.emit('onSensorReading', {kind: 'gyroscope', x: 1, y: 2, z: 3, timestamp: 5});
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({x: 0, y: 0, z: 1, timestamp: 5});
    module.setUpdateInterval(200);
    expect(sensors.start).toHaveBeenLastCalledWith('accelerometer', 200);
    module.stopObserving();
    expect(sensors.stop).toHaveBeenCalledWith('accelerometer');
    DeviceEventEmitter.emit('onSensorReading', {kind: 'accelerometer', x: 0, y: 0, z: 1, timestamp: 6});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('counts the pedometer\'s steps between two dates through the library', async () => {
    const sensors = withSensors();
    const pedometer = createSensorModule(SENSORS[7]);
    await expect(pedometer.getStepCountAsync?.(1000, 2000)).resolves.toEqual({steps: 1234});
    expect(sensors.getStepCount).toHaveBeenCalledWith(1000, 2000);
  });

  it('has nothing available, and permissions denied, without the library', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const modules = createSensorModules();
    await expect(modules.ExponentAccelerometer.isAvailableAsync()).resolves.toBe(false);
    await expect(modules.ExponentAccelerometer.getPermissionsAsync()).resolves.toBe(DENIED);
    await expect(modules.ExponentAccelerometer.requestPermissionsAsync()).resolves.toBe(DENIED);
    await expect(modules.ExponentPedometer.getStepCountAsync?.(0, 1)).rejects.toThrow(/Pedometer\.getStepCountAsync/);
    const module = modules.ExponentAccelerometer as (typeof modules)[string] & {startObserving(): void; stopObserving(): void};
    module.setUpdateInterval(50);
    module.startObserving();
    module.stopObserving();
  });
});

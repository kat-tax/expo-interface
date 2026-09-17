import type {EmitterSubscription} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import type {SensorKind} from '../native';
import type {PermissionResponse} from './permissions';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass, UnavailabilityError} from './base';
import {DENIED, GRANTED} from './permissions';

/** Each `expo-sensors` module: the name its package asks for, the runtime's kind, and the event the package listens to. */
export const SENSORS: readonly {name: string; kind: SensorKind; event: string; constants?: Record<string, number>}[] = [
  {name: 'ExponentAccelerometer', kind: 'accelerometer', event: 'accelerometerDidUpdate'},
  {name: 'ExponentGyroscope', kind: 'gyroscope', event: 'gyroscopeDidUpdate'},
  {name: 'ExponentMagnetometer', kind: 'magnetometer', event: 'magnetometerDidUpdate'},
  {name: 'ExponentMagnetometerUncalibrated', kind: 'magnetometerUncalibrated', event: 'magnetometerUncalibratedDidUpdate'},
  {name: 'ExpoBarometer', kind: 'barometer', event: 'barometerDidUpdate'},
  {name: 'ExpoLightSensor', kind: 'light', event: 'lightSensorDidUpdate'},
  {name: 'ExponentDeviceMotion', kind: 'deviceMotion', event: 'deviceMotionDidUpdate', constants: {Gravity: 9.80665}},
  {name: 'ExponentPedometer', kind: 'pedometer', event: 'Exponent.pedometerUpdate'},
];

/** The package's default, when none is set. */
const DEFAULT_INTERVAL = 100;

type SensorEvents = Record<string, (reading: Record<string, unknown>) => void>;

export interface SensorModule extends InstanceType<NativeModule<SensorEvents>> {
  isAvailableAsync(): Promise<boolean>;
  setUpdateInterval(intervalMs: number): void;
  getPermissionsAsync(): Promise<PermissionResponse>;
  requestPermissionsAsync(): Promise<PermissionResponse>;
  /** The pedometer's: steps between two dates, from the system's history. */
  getStepCountAsync?(start: number, end: number): Promise<{steps: number}>;
}

/**
 * One `expo-sensors` module over the runtime's sensors library: available
 * where the machine has the sensor (most desktops have none, and say so),
 * readings at the interval set while the package listens, and the
 * permissions granted — Windows gates no sensor. The pedometer also counts
 * steps between two dates from the system's history. Without the library
 * nothing is available.
 */
export function createSensorModule(definition: (typeof SENSORS)[number]): SensorModule {
  const {kind, event} = definition;
  const Base = nativeModuleClass();
  class Module extends Base<SensorEvents> implements SensorModule {
    private interval = DEFAULT_INTERVAL;
    private subscription: EmitterSubscription | null = null;

    async isAvailableAsync(): Promise<boolean> {
      return native.sensors()?.available(kind) ?? false;
    }

    setUpdateInterval(intervalMs: number): void {
      this.interval = intervalMs;
      if (this.subscription) native.sensors()?.start(kind, intervalMs);
    }

    async getPermissionsAsync(): Promise<PermissionResponse> {
      return native.sensors() ? GRANTED : DENIED;
    }

    async requestPermissionsAsync(): Promise<PermissionResponse> {
      return native.sensors() ? GRANTED : DENIED;
    }

    startObserving(): void {
      if (this.subscription) return;
      this.subscription = DeviceEventEmitter.addListener('onSensorReading', ({kind: heard, ...reading}: {kind: SensorKind} & Record<string, unknown>) => {
        if (heard === kind) this.emit(event, reading);
      });
      native.sensors()?.start(kind, this.interval);
    }

    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
      native.sensors()?.stop(kind);
    }
  }
  const module = new Module() as unknown as SensorModule & Record<string, unknown>;
  Object.assign(module, definition.constants);
  if (kind === 'pedometer') {
    module.getStepCountAsync = async (start: number, end: number) => {
      const sensors = native.sensors();
      if (!sensors) throw new UnavailabilityError('Pedometer', 'getStepCountAsync');
      return {steps: await sensors.getStepCount(start, end)};
    };
  }
  return module;
}

/** Every sensor module, by the name its package asks for. */
export function createSensorModules(): Record<string, SensorModule> {
  return Object.fromEntries(SENSORS.map(definition => [definition.name, createSensorModule(definition)]));
}

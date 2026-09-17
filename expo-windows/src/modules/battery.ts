import type {EmitterSubscription} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import type {PowerState} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass} from './base';

/**
 * `expo-battery`'s `BatteryState` by the library's word: `NOT_CHARGING`
 * is Android's for a battery plugged in and neither charging nor full,
 * which the power manager reports as idle.
 */
const STATES: Record<PowerState['state'], number> = {UNKNOWN: 0, UNPLUGGED: 1, CHARGING: 2, FULL: 3, NOT_CHARGING: 4};

/** What a machine without the library, or without a battery, reports: as the package's web platform does. */
const NO_BATTERY: PowerState = {hasBattery: false, level: -1, state: 'UNKNOWN', lowPowerMode: false};

type BatteryEvents = {
  'Expo.batteryLevelDidChange'(event: {batteryLevel: number}): void;
  'Expo.batteryStateDidChange'(event: {batteryState: number}): void;
  'Expo.powerModeDidChange'(event: {lowPowerMode: boolean}): void;
};

export interface ExpoBatteryModule extends InstanceType<NativeModule<BatteryEvents>> {
  /** Read at import by the package: whether there is a battery to report on. */
  readonly isSupported: boolean;
  getBatteryLevelAsync(): Promise<number>;
  getBatteryStateAsync(): Promise<number>;
  isLowPowerModeEnabledAsync(): Promise<boolean>;
  isBatteryOptimizationEnabledAsync(): Promise<boolean>;
}

function state(): PowerState {
  return native.power()?.getState() ?? NO_BATTERY;
}

/**
 * `ExpoBattery`, what `expo-battery` asks: the battery's charge as a
 * fraction (-1 without one), its state, and whether the energy saver is on
 * — the package's low power mode — from the runtime's power library, and
 * the package's three events from the power manager's, each sent when its
 * own value changes. Battery optimization is Android's: never on.
 */
export function createBatteryModule(): ExpoBatteryModule {
  const Base = nativeModuleClass();
  class Module extends Base<BatteryEvents> implements ExpoBatteryModule {
    private subscription: EmitterSubscription | null = null;
    private last = state();

    get isSupported(): boolean {
      return state().hasBattery;
    }

    async getBatteryLevelAsync(): Promise<number> {
      return state().level;
    }

    async getBatteryStateAsync(): Promise<number> {
      return STATES[state().state];
    }

    async isLowPowerModeEnabledAsync(): Promise<boolean> {
      return state().lowPowerMode;
    }

    async isBatteryOptimizationEnabledAsync(): Promise<boolean> {
      return false;
    }

    startObserving(): void {
      this.subscription ??= DeviceEventEmitter.addListener('onPowerChanged', (next: PowerState) => {
        const previous = this.last;
        this.last = next;
        if (next.level !== previous.level) this.emit('Expo.batteryLevelDidChange', {batteryLevel: next.level});
        if (next.state !== previous.state) this.emit('Expo.batteryStateDidChange', {batteryState: STATES[next.state]});
        if (next.lowPowerMode !== previous.lowPowerMode) this.emit('Expo.powerModeDidChange', {lowPowerMode: next.lowPowerMode});
      });
    }

    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
  return new Module();
}

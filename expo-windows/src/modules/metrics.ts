import type {NativeModule, SharedObject} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';
import {nativeModuleClass} from './base';

/** The `SharedObject` class of the installed global, the way `nativeModuleClass` takes `NativeModule`. */
function sharedObjectClass(): typeof SharedObject {
  return globalThis.expo.SharedObject as typeof SharedObject;
}

export interface ExpoAppMetricsModule extends InstanceType<NativeModule> {
  getMainSession(): {id: string; type: string};
}

/**
 * `ExpoAppMetrics` and `ExpoObserve`, what `expo-app-metrics` and
 * `expo-observe` record through — and what `expo-image` asks for, optionally,
 * to time its loads. Nothing on Windows collects the records: the marks and
 * events are taken and dropped, the sessions are empty, and the network
 * observer observes nothing, which is the shape the packages' web modules
 * have.
 */
export function createAppMetricsModule(): ExpoAppMetricsModule {
  const Base = nativeModuleClass();
  const Shared = sharedObjectClass();
  class NetworkRequestObserver extends Shared {}
  class Session extends Shared {
    readonly id = 'windows-session';
    readonly startDate = new Date().toISOString();
    constructor(readonly type: string = 'main') {
      super();
    }
    async isActive(): Promise<boolean> {
      return true;
    }
    async getEndDate(): Promise<null> {
      return null;
    }
    async getMetrics(): Promise<never[]> {
      return [];
    }
    async getLogs(): Promise<never[]> {
      return [];
    }
    async addMetric(): Promise<void> {}
  }
  class Module extends Base implements ExpoAppMetricsModule {
    readonly NetworkRequestObserver = NetworkRequestObserver;
    readonly Session = Session;
    private mainSession: Session | null = null;

    async markFirstRender(): Promise<void> {}
    async markInteractive(): Promise<void> {}
    logEvent(): void {}
    setGlobalAttributes(): void {}
    async clearStoredEntries(): Promise<void> {}
    async getInactiveSessions(): Promise<never[]> {
      return [];
    }
    reportError(): void {}
    getMainSession(): Session {
      this.mainSession ??= new Session('main');
      return this.mainSession;
    }
    async getForegroundSession(): Promise<null> {
      return null;
    }
  }
  return new Module();
}

/**
 * `expo-observe` forwards any member that is not the module's own — by
 * `Object.keys`, since Android's module is a host object — to
 * `expo-app-metrics`, so the members are own properties here, not methods
 * of the class.
 */
export function createObserveModule(): InstanceType<NativeModule> {
  const Base = nativeModuleClass();
  class Module extends Base {
    readonly dispatchEvents = async (): Promise<void> => {};
    readonly configure = (): void => {};
    readonly getIntegrations = (): Record<string, never> => ({});
    readonly registerIntegration = (): void => {};
    readonly logEvent = (): void => {};
    readonly reportError = (): void => {};
    readonly markFirstRender = (): void => {};
    readonly markInteractive = (): void => {};
    readonly setGlobalAttributes = (): void => {};
    readonly setBundleDefaults = (): void => {};
  }
  return new Module();
}

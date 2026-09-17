import type {NativeModule} from 'expo-modules-core';
import {Dimensions} from 'react-native';
import {nativeModuleClass} from './base';

/** `Orientation` in `expo-screen-orientation`. */
export const PORTRAIT_UP = 1;
export const LANDSCAPE_LEFT = 3;

/** `OrientationLock` in `expo-screen-orientation`: the two that constrain nothing. */
export const LOCK_DEFAULT = 0;
export const LOCK_ALL = 1;

type OrientationEvents = {
  expoDidUpdateDimensions(event: {orientationLock: number; orientationInfo: {orientation: number}}): void;
};

export interface ExpoScreenOrientationModule extends InstanceType<NativeModule<OrientationEvents>> {
  getOrientationAsync(): Promise<number>;
  getOrientationLockAsync(): Promise<number>;
  getPlatformOrientationLockAsync(): Promise<number>;
  supportsOrientationLockAsync(lock: number): Promise<boolean>;
  lockAsync(lock: number): Promise<void>;
  lockPlatformAsync(lock: number): Promise<void>;
}

/** The orientation a window of this size is in: landscape when it is wider than tall. */
export function orientationOf(size: {width: number; height: number}): number {
  return size.width >= size.height ? LANDSCAPE_LEFT : PORTRAIT_UP;
}

/**
 * `ExpoScreenOrientation`, what `expo-screen-orientation` reads. A window's
 * orientation is its shape — landscape when wider than tall — and nothing
 * can lock it: the two locks that constrain nothing are supported, any
 * other is refused with the package's own error code. A window resize that
 * changes the shape reports as the dimensions event the package listens to.
 */
export function createScreenOrientationModule(): ExpoScreenOrientationModule {
  const Base = nativeModuleClass();
  class Module extends Base<OrientationEvents> implements ExpoScreenOrientationModule {
    private lock = LOCK_DEFAULT;
    private last = orientationOf(Dimensions.get('window'));
    private subscription: {remove(): void} | null = null;

    async getOrientationAsync(): Promise<number> {
      return orientationOf(Dimensions.get('window'));
    }
    async getOrientationLockAsync(): Promise<number> {
      return this.lock;
    }
    async getPlatformOrientationLockAsync(): Promise<number> {
      return this.lock;
    }
    async supportsOrientationLockAsync(lock: number): Promise<boolean> {
      return lock === LOCK_DEFAULT || lock === LOCK_ALL;
    }
    async lockAsync(lock: number): Promise<void> {
      if (!(await this.supportsOrientationLockAsync(lock))) {
        const error = new Error(`A window cannot be locked to orientation ${lock} on Windows`) as Error & {code: string};
        error.code = 'ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK';
        throw error;
      }
      this.lock = lock;
    }
    async lockPlatformAsync(lock: number): Promise<void> {
      await this.lockAsync(lock);
    }

    startObserving(): void {
      this.subscription ??= Dimensions.addEventListener('change', ({window}) => {
        const orientation = orientationOf(window);
        if (orientation === this.last) return;
        this.last = orientation;
        this.emit('expoDidUpdateDimensions', {orientationLock: this.lock, orientationInfo: {orientation}});
      });
    }
    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
  return new Module();
}

import type {NativeModule} from 'expo-modules-core';
import type {PermissionResponse} from './permissions';
import {native} from '../native';
import {nativeModuleClass} from './base';
import {DENIED} from './permissions';

type ScreenCaptureEvents = {
  onScreenshot(): void;
};

export interface ExpoScreenCaptureModule extends InstanceType<NativeModule<ScreenCaptureEvents>> {
  readonly preventScreenCapture: (() => Promise<void>) | undefined;
  readonly allowScreenCapture: (() => Promise<void>) | undefined;
  getPermissionsAsync(): Promise<PermissionResponse>;
  requestPermissionsAsync(): Promise<PermissionResponse>;
}

/**
 * `ExpoScreenCapture`, what `expo-screen-capture` asks: the window kept
 * out of screen captures and recordings (a capture shows black where it
 * is) and let back in, through the runtime's window library — the package
 * takes the presence of both methods as availability, so they are there
 * only with the library. Windows raises no event for a screenshot, so the
 * detection permission is denied and `onScreenshot` never sent; the app
 * switcher protection is iOS's.
 */
export function createScreenCaptureModule(): ExpoScreenCaptureModule {
  const Base = nativeModuleClass();
  class Module extends Base<ScreenCaptureEvents> implements ExpoScreenCaptureModule {
    get preventScreenCapture(): (() => Promise<void>) | undefined {
      const window = native.window();
      return window
        ? async () => {
            await window.setCaptureExcluded(true);
          }
        : undefined;
    }

    get allowScreenCapture(): (() => Promise<void>) | undefined {
      const window = native.window();
      return window
        ? async () => {
            await window.setCaptureExcluded(false);
          }
        : undefined;
    }

    async getPermissionsAsync(): Promise<PermissionResponse> {
      return DENIED;
    }

    async requestPermissionsAsync(): Promise<PermissionResponse> {
      return DENIED;
    }
  }
  return new Module();
}

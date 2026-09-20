import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/** The kit's Windows share module (`windows/ExpoInterface/Share.cpp`). */
export interface ShareModule extends TurboModule {
  /** Whether there is a window to open the sheet over yet. */
  isAvailable(): Promise<boolean>;
  /** Opens the sheet; resolves whether one could be opened at all. */
  share(title: string, message: string, url: string): Promise<boolean>;
}

/**
 * The module, or `null` in a bundle that has not linked the kit's Windows
 * library — a test, or an app that took the JavaScript without the native side.
 * `TurboModuleRegistry.get` returns an auto-mock for an unknown name under the
 * test runner, which is why callers check the shape rather than the truthiness.
 */
export function shareModule(): ShareModule | null {
  return TurboModuleRegistry.get<ShareModule>('ExpoInterfaceShare');
}

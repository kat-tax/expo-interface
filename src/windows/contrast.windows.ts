import type {HighContrast, HighContrastColors} from './contrast-palette';
import {useSyncExternalStore} from 'react';
import {requireOptionalNativeModule} from 'expo-modules-core';
import {NO_CONTRAST, highContrastPalette} from './contrast-palette';

export type {HighContrast, HighContrastColors};
export {NO_CONTRAST, highContrastPalette};

/** What the runtime reports: the setting, the theme's name, and the system's colours as they stand. */
interface HighContrastState {
  enabled: boolean;
  scheme: string;
  colors: HighContrastColors;
}

/** The runtime's window module (`expo-windows`), when the app runs on it; a runtime from before 0.4.0 has neither call. */
interface WindowsModule {
  getHighContrastAsync?(): Promise<HighContrastState>;
  addHighContrastListener?(listener: (state: HighContrastState) => void): {remove(): void};
}

/** The setting as it stands, for every palette to read. */
let contrast: HighContrast = NO_CONTRAST;
const listeners = new Set<() => void>();
let source: {remove(): void} | null = null;

function publish(state: HighContrastState) {
  contrast = {enabled: state.enabled, scheme: state.scheme, colors: state.enabled ? state.colors : null};
  for (const listener of listeners) listener();
}

function leaveTheColors() {
  // The runtime could not say: the palette stays the scheme's.
}

/** Asks the runtime once, and follows its changes, while anything reads the setting. */
function follow() {
  const windows = requireOptionalNativeModule<WindowsModule>('ExpoWindows');
  if (!windows?.getHighContrastAsync || !windows.addHighContrastListener) {
    contrast = NO_CONTRAST;
    return;
  }
  source = windows.addHighContrastListener(publish);
  windows.getHighContrastAsync().then(publish).catch(leaveTheColors);
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) follow();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      source?.remove();
      source = null;
    }
  };
}

function snapshot(): HighContrast {
  return contrast;
}

/**
 * Windows, on `expo-windows`: the system's high contrast setting, read from
 * the runtime and followed as the user turns it on or off; the kit's
 * palette takes the theme's colours while it is on. Off without the runtime.
 */
export function useHighContrast(): HighContrast {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

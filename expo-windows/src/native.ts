import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * The runtime's own TurboModules, from its Windows library
 * (`windows/ExpoWindows`, autolinked into the app), each asked for at the
 * time it is used and `null` while the library is not in the app — the
 * JavaScript modules then fall back to what the platform gives them
 * without it.
 */

export interface NativeWindow extends TurboModule {
  setTitle(title: string): void;
  getTitle(): Promise<string>;
}

export interface DeviceConstants {
  deviceName?: string;
  manufacturer?: string;
  brand?: string;
  modelName?: string;
  productName?: string;
  modelId?: string;
  designName?: string;
  osVersion?: string;
  osBuildId?: string;
  totalMemory?: number;
  supportedCpuArchitectures?: string[];
}

export interface NativeDevice extends TurboModule {
  getConstants(): DeviceConstants;
  getUptime(): Promise<number>;
}

export interface ClipboardImage {
  data: string;
  size: {width: number; height: number};
}

export interface NativeClipboard extends TurboModule {
  getString(preferredFormat: string): Promise<string>;
  setString(text: string, inputFormat: string): Promise<boolean>;
  hasString(): Promise<boolean>;
  getUrl(): Promise<string>;
  setUrl(url: string): Promise<void>;
  hasUrl(): Promise<boolean>;
  getImage(): Promise<ClipboardImage | null>;
  setImage(base64: string): Promise<void>;
  hasImage(): Promise<boolean>;
}

export interface NativeSharing extends TurboModule {
  isAvailable(): Promise<boolean>;
  share(path: string, title: string): Promise<void>;
}

export interface NativeLinking extends TurboModule {
  getInitialUrl(): Promise<string>;
  registerProtocol(scheme: string, displayName: string): Promise<void>;
}

export interface NativeFonts extends TurboModule {
  load(family: string, uri: string): Promise<void>;
  unload(family: string): Promise<void>;
}

function get<T extends TurboModule>(name: string): T | null {
  return TurboModuleRegistry.get<T>(name);
}

export const native = {
  window: () => get<NativeWindow>('ExpoWindowsWindow'),
  device: () => get<NativeDevice>('ExpoWindowsDevice'),
  clipboard: () => get<NativeClipboard>('ExpoWindowsClipboard'),
  sharing: () => get<NativeSharing>('ExpoWindowsSharing'),
  linking: () => get<NativeLinking>('ExpoWindowsLinking'),
  fonts: () => get<NativeFonts>('ExpoWindowsFonts'),
};

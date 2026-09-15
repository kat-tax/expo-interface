import type {NativeModule} from 'expo-modules-core';
import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';
import {nativeModuleClass} from './base';

type ExpoClipboardEvents = {
  onClipboardChanged(event: {contentTypes: string[]}): void;
};

export interface ExpoClipboardModule extends InstanceType<NativeModule<ExpoClipboardEvents>> {
  readonly isPasteButtonAvailable: boolean;
  getStringAsync(options?: {preferredFormat?: string}): Promise<string>;
  setStringAsync(text: string, options?: {inputFormat?: string}): Promise<boolean>;
  hasStringAsync(): Promise<boolean>;
}

/** react-native-windows' own clipboard module, kept in the react-native namespace as `Clipboard`. */
interface NativeClipboard extends TurboModule {
  getString(): Promise<string>;
  setString(content: string): void;
}

function nativeClipboard(): NativeClipboard | null {
  return TurboModuleRegistry.get<NativeClipboard>('Clipboard');
}

/**
 * `ExpoClipboard`, what `expo-clipboard` reads and writes through: text,
 * over the clipboard module react-native-windows carries. The URL and image
 * methods are left out, so `expo-clipboard` reports them unavailable rather
 * than failing later; the paste button is iOS only. Change events need the
 * platform's `Clipboard.ContentChanged`, a later C++ module.
 */
export function createClipboardModule(): ExpoClipboardModule {
  const Base = nativeModuleClass();
  class Module extends Base<ExpoClipboardEvents> implements ExpoClipboardModule {
    readonly isPasteButtonAvailable = false;

    async getStringAsync(_options?: {preferredFormat?: string}): Promise<string> {
      return (await nativeClipboard()?.getString()) ?? '';
    }

    async setStringAsync(text: string, _options?: {inputFormat?: string}): Promise<boolean> {
      const clipboard = nativeClipboard();
      if (!clipboard) return false;
      clipboard.setString(text);
      return true;
    }

    async hasStringAsync(): Promise<boolean> {
      return (await this.getStringAsync()).length > 0;
    }
  }
  return new Module();
}

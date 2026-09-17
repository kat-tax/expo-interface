import type {EmitterSubscription, TurboModule} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import type {ClipboardImage} from '../native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {native} from '../native';
import {nativeModuleClass, UnavailabilityError} from './base';

type ExpoClipboardEvents = {
  onClipboardChanged(event: {contentTypes: string[]}): void;
};

export interface ExpoClipboardModule extends InstanceType<NativeModule<ExpoClipboardEvents>> {
  readonly isPasteButtonAvailable: boolean;
  getStringAsync(options?: {preferredFormat?: string}): Promise<string>;
  setStringAsync(text: string, options?: {inputFormat?: string}): Promise<boolean>;
  hasStringAsync(): Promise<boolean>;
  getUrlAsync(): Promise<string | null>;
  setUrlAsync(url: string): Promise<void>;
  hasUrlAsync(): Promise<boolean>;
  getImageAsync(options?: {format?: string; jpegQuality?: number}): Promise<ClipboardImage | null>;
  setImageAsync(base64Image: string): Promise<void>;
  hasImageAsync(): Promise<boolean>;
  startObserving(): void;
  stopObserving(): void;
}

/** react-native-windows' own clipboard module, kept in the react-native namespace as `Clipboard`. */
interface CoreClipboard extends TurboModule {
  getString(): Promise<string>;
  setString(content: string): void;
}

function coreClipboard(): CoreClipboard | null {
  return TurboModuleRegistry.get<CoreClipboard>('Clipboard');
}

/** The runtime's clipboard, or the package's error for what needs it. */
function required(method: string) {
  const clipboard = native.clipboard();
  if (!clipboard) throw new UnavailabilityError('Clipboard', method);
  return clipboard;
}

/**
 * `ExpoClipboard`, what `expo-clipboard` reads and writes through. With the
 * runtime's Windows library in the app: text (plain or HTML), links and
 * images over the platform's clipboard, and `onClipboardChanged` from its
 * `ContentChanged`, with the content types on offer. Without it: text over
 * the clipboard module react-native-windows carries, and the rest reported
 * unavailable. The paste button is iOS only.
 */
export function createClipboardModule(): ExpoClipboardModule {
  const Base = nativeModuleClass();
  class Module extends Base<ExpoClipboardEvents> implements ExpoClipboardModule {
    readonly isPasteButtonAvailable = false;
    private subscription: EmitterSubscription | null = null;

    async getStringAsync(options?: {preferredFormat?: string}): Promise<string> {
      const clipboard = native.clipboard();
      if (clipboard) return clipboard.getString(options?.preferredFormat ?? 'plainText');
      return (await coreClipboard()?.getString()) ?? '';
    }

    async setStringAsync(text: string, options?: {inputFormat?: string}): Promise<boolean> {
      const clipboard = native.clipboard();
      if (clipboard) return clipboard.setString(text, options?.inputFormat ?? 'plainText');
      const core = coreClipboard();
      if (!core) return false;
      core.setString(text);
      return true;
    }

    async hasStringAsync(): Promise<boolean> {
      const clipboard = native.clipboard();
      if (clipboard) return clipboard.hasString();
      return (await this.getStringAsync()).length > 0;
    }

    async getUrlAsync(): Promise<string | null> {
      const url = await required('getUrlAsync').getUrl();
      return url || null;
    }

    async setUrlAsync(url: string): Promise<void> {
      await required('setUrlAsync').setUrl(url);
    }

    async hasUrlAsync(): Promise<boolean> {
      return required('hasUrlAsync').hasUrl();
    }

    async getImageAsync(_options?: {format?: string; jpegQuality?: number}): Promise<ClipboardImage | null> {
      return required('getImageAsync').getImage();
    }

    async setImageAsync(base64Image: string): Promise<void> {
      await required('setImageAsync').setImage(base64Image);
    }

    async hasImageAsync(): Promise<boolean> {
      return required('hasImageAsync').hasImage();
    }

    startObserving(): void {
      this.subscription ??= DeviceEventEmitter.addListener('onClipboardChanged', (event: {contentTypes: string[]}) => {
        this.emit('onClipboardChanged', event);
      });
    }

    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
  return new Module();
}

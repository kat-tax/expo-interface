import type {NativeModule} from 'expo-modules-core';
import {nativeModuleClass} from './base';

export interface ExpoFontLoaderModule extends InstanceType<NativeModule> {
  getLoadedFonts(): string[];
  loadAsync(fontFamilyName: string, localUriOrWebAsset: unknown): Promise<void>;
  isLoaded(fontFamilyName: string): boolean;
  unloadAsync(fontFamilyName: string): Promise<void>;
  unloadAllAsync(): Promise<void>;
}

/**
 * `ExpoFontLoader`, what `expo-font` loads through. Windows keeps the
 * families an app loads and reports them loaded, so `Font.loadAsync` and
 * `useFonts` resolve and a screen renders — in the system's font until the
 * C++ module that registers a font file with react-native-windows lands;
 * a family installed on the machine draws already, since react-native-windows
 * resolves `fontFamily` from the system's collection.
 */
export function createFontLoaderModule(): ExpoFontLoaderModule {
  const Base = nativeModuleClass();
  class Module extends Base implements ExpoFontLoaderModule {
    private readonly loaded = new Set<string>();

    getLoadedFonts(): string[] {
      return [...this.loaded];
    }

    async loadAsync(fontFamilyName: string, _localUriOrWebAsset: unknown): Promise<void> {
      this.loaded.add(fontFamilyName);
    }

    isLoaded(fontFamilyName: string): boolean {
      return this.loaded.has(fontFamilyName);
    }

    async unloadAsync(fontFamilyName: string): Promise<void> {
      this.loaded.delete(fontFamilyName);
    }

    async unloadAllAsync(): Promise<void> {
      this.loaded.clear();
    }
  }
  return new Module();
}

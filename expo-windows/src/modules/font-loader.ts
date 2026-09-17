import type {NativeModule} from 'expo-modules-core';
import {native} from '../native';
import {nativeModuleClass} from './base';

export interface ExpoFontLoaderModule extends InstanceType<NativeModule> {
  getLoadedFonts(): string[];
  loadAsync(fontFamilyName: string, localUriOrWebAsset: unknown): Promise<void>;
  isLoaded(fontFamilyName: string): boolean;
  unloadAsync(fontFamilyName: string): Promise<void>;
  unloadAllAsync(): Promise<void>;
}

/** The URI a font source names: a string, or an asset's `uri`. */
function uriOf(source: unknown): string | null {
  if (typeof source === 'string') return source;
  const uri = (source as {uri?: unknown} | null)?.uri;
  return typeof uri === 'string' ? uri : null;
}

/**
 * `ExpoFontLoader`, what `expo-font` loads through. With the runtime's
 * Windows library in the app, the font file — local, or fetched when Metro
 * or a web host serves it — is registered with the process, which is how
 * react-native-windows' text finds it: by the family name inside the file,
 * so the name a font is loaded under must be that name. Without the
 * library the families are only kept and reported loaded, so `useFonts`
 * resolves and a screen renders, in the system's font; a family installed
 * on the machine draws already.
 */
export function createFontLoaderModule(): ExpoFontLoaderModule {
  const Base = nativeModuleClass();
  class Module extends Base implements ExpoFontLoaderModule {
    private readonly loaded = new Set<string>();

    getLoadedFonts(): string[] {
      return [...this.loaded];
    }

    async loadAsync(fontFamilyName: string, localUriOrWebAsset: unknown): Promise<void> {
      const fonts = native.fonts();
      const uri = uriOf(localUriOrWebAsset);
      if (fonts && uri) await fonts.load(fontFamilyName, uri);
      this.loaded.add(fontFamilyName);
    }

    isLoaded(fontFamilyName: string): boolean {
      return this.loaded.has(fontFamilyName);
    }

    async unloadAsync(fontFamilyName: string): Promise<void> {
      if (this.loaded.delete(fontFamilyName)) await native.fonts()?.unload(fontFamilyName);
    }

    async unloadAllAsync(): Promise<void> {
      // Deleting the family being visited is fine for a Set.
      for (const family of this.loaded) await this.unloadAsync(family);
    }
  }
  return new Module();
}

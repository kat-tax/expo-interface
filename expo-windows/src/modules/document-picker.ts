import type {NativeFileSystem} from '../native';
import {native, unwrap} from '../native';
import {UnavailabilityError} from './base';
import {childUri, nameOf} from './file-system';

export type DocumentPickerAsset = {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  lastModified: number;
};

export type DocumentPickerResult = {canceled: false; assets: DocumentPickerAsset[]} | {canceled: true; assets: null};

function library(method: string): NativeFileSystem {
  const fileSystem = native.fileSystem();
  if (!fileSystem) throw new UnavailabilityError('DocumentPicker', method);
  return fileSystem;
}

/** Whether a rejection is the user leaving the picker rather than a failure. */
export function isCancellation(error: unknown): boolean {
  return error instanceof Error && /did not pick/.test(error.message);
}

/** The picked file as the package describes it, copied into the app's cache when asked. */
export function assetOf(fileSystem: NativeFileSystem, uri: string, copyToCache: boolean): DocumentPickerAsset {
  const info = unwrap(fileSystem.info(uri));
  let location = uri;
  if (copyToCache) {
    const cache = fileSystem.getConstants().cacheDirectory;
    if (cache) location = unwrap(fileSystem.copy(uri, childUri(`${cache}DocumentPicker/`, nameOf(uri)), true));
  }
  const asset: DocumentPickerAsset = {uri: location, name: nameOf(uri), size: info.size, lastModified: info.modificationTime};
  if (info.type) asset.mimeType = info.type;
  return asset;
}

/**
 * `ExpoDocumentPicker`, what `expo-document-picker` picks through: the
 * file picker for the app's window, filtered by the MIME types asked for,
 * with each pick described from the file system and, as the package
 * defaults to, copied into the app's cache so it stays readable.
 */
export const ExpoDocumentPicker = {
  async getDocumentAsync(options: {type?: string[]; copyToCacheDirectory?: boolean; multiple?: boolean; base64?: boolean} = {}): Promise<DocumentPickerResult> {
    const fileSystem = library('getDocumentAsync');
    try {
      const picked = await fileSystem.pickFile('', options.type ?? [], options.multiple ?? false);
      const uris = Array.isArray(picked) ? picked : [picked];
      return {canceled: false, assets: uris.map(file => assetOf(fileSystem, file.uri, options.copyToCacheDirectory ?? true))};
    } catch (error) {
      if (isCancellation(error)) return {canceled: true, assets: null};
      throw error;
    }
  },
};

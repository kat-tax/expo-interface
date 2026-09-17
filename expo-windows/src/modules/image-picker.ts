import type {NativeFileSystem, NativeImages} from '../native';
import {native, unwrap} from '../native';
import {UnavailabilityError} from './base';
import {isCancellation} from './document-picker';
import {nameOf} from './file-system';
import {GRANTED, type PermissionResponse} from './permissions';

export type ImagePickerAsset = {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  base64?: string;
  duration?: number | null;
  assetId?: null;
};

export type ImagePickerResult = {canceled: false; assets: ImagePickerAsset[]} | {canceled: true; assets: null};

export type ImagePickerOptions = {
  mediaTypes?: string | string[];
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
  base64?: boolean;
  quality?: number;
  allowsEditing?: boolean;
  exif?: boolean;
};

const VIDEO = /\.(mp4|mov|mkv|avi|webm|m4v|wmv)$/i;

function libraries(method: string): {fileSystem: NativeFileSystem; images: NativeImages} {
  const fileSystem = native.fileSystem();
  const images = native.images();
  if (!fileSystem || !images) throw new UnavailabilityError('ImagePicker', method);
  return {fileSystem, images};
}

/** The MIME families the picker filters by, from the package's media types (`images`, `videos`, or the older `Images` / `Videos` / `All`). */
export function mimeTypesFor(mediaTypes: string | string[] | undefined): string[] {
  const list = mediaTypes === undefined ? ['images'] : Array.isArray(mediaTypes) ? mediaTypes : [mediaTypes];
  const families = new Set<string>();
  for (const type of list) {
    const lower = type.toLowerCase();
    if (lower === 'all') {
      families.add('image/*');
      families.add('video/*');
    } else if (lower.startsWith('video')) families.add('video/*');
    else families.add('image/*');
  }
  return [...families];
}

/** The picked or captured file as the package describes an asset. */
export async function assetOf(fileSystem: NativeFileSystem, images: NativeImages, uri: string, base64: boolean): Promise<ImagePickerAsset> {
  const info = unwrap(fileSystem.info(uri));
  const video = VIDEO.test(uri);
  const size = video ? {width: 0, height: 0} : await images.info(uri).catch(() => ({width: 0, height: 0}));
  const asset: ImagePickerAsset = {uri, ...size, type: video ? 'video' : 'image', fileName: nameOf(uri), fileSize: info.size, assetId: null};
  if (info.type) asset.mimeType = info.type;
  if (video) asset.duration = null;
  if (base64 && !video) asset.base64 = unwrap(fileSystem.readBase64(uri));
  return asset;
}

/**
 * `ExponentImagePicker`, what `expo-image-picker` picks and captures
 * through: the file picker filtered to images or videos, and the camera
 * capture UI for a photo or a video. Windows gates neither behind a
 * prompt of the app's own — the picker is the user's, the camera's privacy
 * setting the system's — so the permissions are granted. Editing and EXIF
 * are accepted without effect.
 */
export const ExponentImagePicker = {
  async getCameraPermissionsAsync(): Promise<PermissionResponse> {
    return GRANTED;
  },
  async requestCameraPermissionsAsync(): Promise<PermissionResponse> {
    return GRANTED;
  },
  async getMediaLibraryPermissionsAsync(): Promise<PermissionResponse> {
    return GRANTED;
  },
  async requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse> {
    return GRANTED;
  },
  async launchImageLibraryAsync(options: ImagePickerOptions = {}): Promise<ImagePickerResult> {
    const {fileSystem, images} = libraries('launchImageLibraryAsync');
    try {
      const multiple = options.allowsMultipleSelection ?? false;
      const picked = await fileSystem.pickFile('', mimeTypesFor(options.mediaTypes), multiple);
      let uris = (Array.isArray(picked) ? picked : [picked]).map(file => file.uri);
      if (multiple && options.selectionLimit && options.selectionLimit > 0) uris = uris.slice(0, options.selectionLimit);
      return {canceled: false, assets: await Promise.all(uris.map(uri => assetOf(fileSystem, images, uri, options.base64 ?? false)))};
    } catch (error) {
      if (isCancellation(error)) return {canceled: true, assets: null};
      throw error;
    }
  },
  async launchCameraAsync(options: ImagePickerOptions = {}): Promise<ImagePickerResult> {
    const {fileSystem, images} = libraries('launchCameraAsync');
    const video = mimeTypesFor(options.mediaTypes).includes('video/*') && !mimeTypesFor(options.mediaTypes).includes('image/*');
    const captured = await images.capture(video);
    if (!captured) return {canceled: true, assets: null};
    return {canceled: false, assets: [await assetOf(fileSystem, images, captured.uri, options.base64 ?? false)]};
  },
};

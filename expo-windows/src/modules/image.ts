import type {LoadedImage} from '../native';
import {native} from '../native';
import {UnavailabilityError} from './base';

/** What `expo-image` calls a source once resolved: a URI with what is known about it. */
export interface ResolvedImageSource {
  uri?: string;
  width?: number | null;
  height?: number | null;
  headers?: Record<string, string>;
  cacheKey?: string;
  scale?: number;
}

export type CachePolicy = 'none' | 'disk' | 'memory' | 'memory-disk';

/**
 * `expo-image`'s `ImageRef` on Windows: an image the loader fetched, by
 * where it is now and the size the codec read. The view shows one through
 * its `uri`; releasing it frees nothing here, since the file stays in the
 * cache.
 */
export class ImageRef {
  readonly nativeRefType = 'image';
  readonly scale = 1;

  constructor(
    readonly uri: string,
    readonly width: number,
    readonly height: number,
    readonly mediaType: string | null,
    readonly isAnimated: boolean,
  ) {}

  release(): void {}

  /** The reference as a source the view takes. */
  toSource(): ResolvedImageSource {
    return {uri: this.uri, width: this.width, height: this.height};
  }
}

export function isImageRef(value: unknown): value is ImageRef {
  return value instanceof ImageRef;
}

/** The loader library, or the package's own error naming what was asked without it. */
function loader(method: string) {
  const library = native.imageLoader();
  if (!library) throw new UnavailabilityError('ExpoImage', method);
  return library;
}

/** The URI a source names, and the rest the loader wants. */
function partsOf(source: string | ImageRef | ResolvedImageSource, method: string): {uri: string; headers: Record<string, string> | null; cacheKey: string} {
  if (typeof source === 'string') return {uri: source, headers: null, cacheKey: ''};
  if (isImageRef(source)) return {uri: source.uri, headers: null, cacheKey: ''};
  if (!source?.uri) throw new Error(`ExpoImage.${method} needs a source with a URI`);
  return {uri: source.uri, headers: source.headers ?? null, cacheKey: source.cacheKey ?? ''};
}

function refOf(loaded: LoadedImage): ImageRef {
  return new ImageRef(loaded.uri, loaded.width, loaded.height, loaded.mediaType || null, loaded.isAnimated);
}

export async function prefetch(urls: string[], cachePolicy: CachePolicy = 'memory-disk', headers?: Record<string, string>): Promise<boolean> {
  const library = native.imageLoader();
  if (!library) return false;
  return library.prefetch(urls, cachePolicy, headers ?? null);
}

export async function clearMemoryCache(): Promise<boolean> {
  const library = native.imageLoader();
  return library ? library.clearMemoryCache() : false;
}

export async function clearDiskCache(): Promise<boolean> {
  const library = native.imageLoader();
  return library ? library.clearDiskCache() : false;
}

export async function getCachePath(cacheKey: string): Promise<string | null> {
  const library = native.imageLoader();
  return library ? library.getCachePath(cacheKey) : null;
}

export async function writeToCache(source: string | ImageRef, cacheKey: string): Promise<void> {
  await loader('writeToCacheAsync').writeToCache(partsOf(source, 'writeToCacheAsync').uri, cacheKey);
}

/** The image cached under the key, loaded; null when nothing is. */
export async function readFromCache(cacheKey: string): Promise<ImageRef | null> {
  const library = loader('readFromCacheAsync');
  const path = await library.getCachePath(cacheKey);
  if (!path) return null;
  return refOf(await library.load(path, null, ''));
}

/** Fetches the source and answers with the reference; `maxWidth` and `maxHeight` are taken without effect, the picture is decoded whole. */
export async function loadImage(source: string | ImageRef | ResolvedImageSource): Promise<ImageRef> {
  const library = loader('loadAsync');
  const {uri, headers, cacheKey} = partsOf(source, 'loadAsync');
  return refOf(await library.load(uri, headers, cacheKey));
}

export async function generateBlurhash(source: string | ImageRef, components: [number, number] | {width: number; height: number} = [4, 3]): Promise<string> {
  const [x, y] = Array.isArray(components) ? components : [components.width, components.height];
  return loader('generateBlurhashAsync').generateBlurhash(partsOf(source, 'generateBlurhashAsync').uri, x, y);
}

/**
 * `ExpoImage`, the module behind `expo-image` on Windows: the disk cache
 * (`cache\ExpoImage` under the app's local data) prefetched, cleared and
 * read, an image loaded for its reference, and a blurhash made from one —
 * through the runtime's image loader. Without the library the caches
 * answer false or empty, and what needs the loader says so. A thumbhash
 * is not made here.
 */
export function createImageModule() {
  return {
    Image: ImageRef,
    prefetch,
    clearMemoryCache,
    clearDiskCache,
    getCachePathAsync: getCachePath,
    writeToCacheAsync: writeToCache,
    readFromCacheAsync: readFromCache,
    loadAsync: loadImage,
    generateBlurhashAsync: generateBlurhash,
    async generateThumbhashAsync(): Promise<string> {
      throw new UnavailabilityError('ExpoImage', 'generateThumbhashAsync');
    },
    configureCache(): void {},
  };
}

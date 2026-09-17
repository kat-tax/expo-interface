import type {EmitterSubscription} from 'react-native';
import type {SharedObject} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';
import type {MediaAlbum, MediaAsset, MediaAssetInfo, MediaKind, NativeMediaLibrary} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass, UnavailabilityError} from './base';
import {GRANTED, type PermissionResponse} from './permissions';

type MediaLibraryEvents = {
  mediaLibraryDidChange(event: {hasIncrementalChanges: boolean}): void;
};

const ACCESS: PermissionResponse & {accessPrivileges: 'all'} = {...GRANTED, accessPrivileges: 'all'};

/** The sort keys the package names; `default` is by creation time. */
const SORT_KEYS = ['default', 'mediaType', 'width', 'height', 'creationTime', 'modificationTime', 'duration'] as const;
type SortKey = (typeof SORT_KEYS)[number];
/** A key with its direction: the package sends `"<key> ASC"` or `"<key> DESC"`; a pair or a bare key (descending) is taken too. */
type SortBy = SortKey | `${SortKey} ${'ASC' | 'DESC'}` | [SortKey, boolean];

export type AssetsOptions = {
  first?: number;
  after?: string;
  album?: string;
  sortBy?: SortBy[] | SortBy;
  mediaType?: MediaKind[] | MediaKind;
  createdAfter?: number;
  createdBefore?: number;
};

export type PagedAssets = {assets: MediaAsset[]; endCursor: string; hasNextPage: boolean; totalCount: number};

function library(method: string): NativeMediaLibrary {
  const mediaLibrary = native.mediaLibrary();
  if (!mediaLibrary) throw new UnavailabilityError('MediaLibrary', method);
  return mediaLibrary;
}

function asList<T>(value: T[] | T | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

/** Assets ordered as the package's `sortBy` asks: by each key in turn, newest first without any. */
export function sortAssets(assets: MediaAsset[], sortBy: SortBy[] | SortBy | undefined): MediaAsset[] {
  const single = Array.isArray(sortBy) && sortBy.length === 2 && typeof sortBy[1] === 'boolean';
  const descriptors = (single ? [sortBy as [SortKey, boolean]] : asList(sortBy as SortBy[] | SortBy | undefined)).map((entry): [SortKey, boolean] => {
    if (Array.isArray(entry)) return entry;
    const [key, direction] = entry.split(' ') as [SortKey, string?];
    return [key, direction === 'ASC'];
  });
  const keys = descriptors.length ? descriptors : ([['default', false]] as [SortKey, boolean][]);
  const valueOf = (asset: MediaAsset, key: SortKey): number | string => (key === 'default' ? asset.creationTime : asset[key]);
  return [...assets].sort((a, b) => {
    for (const [key, ascending] of keys) {
      const left = valueOf(a, key);
      const right = valueOf(b, key);
      if (left === right) continue;
      return (left < right ? -1 : 1) * (ascending ? 1 : -1);
    }
    return 0;
  });
}

/** The page of assets the package's options ask for, out of the whole list. */
export function pageAssets(all: MediaAsset[], options: AssetsOptions): PagedAssets {
  const kinds = asList(options.mediaType);
  let assets = kinds.length ? all.filter(asset => kinds.includes(asset.mediaType)) : all;
  if (options.createdAfter !== undefined) assets = assets.filter(asset => asset.creationTime > options.createdAfter!);
  if (options.createdBefore !== undefined) assets = assets.filter(asset => asset.creationTime < options.createdBefore!);
  assets = sortAssets(assets, options.sortBy);
  const start = options.after ? assets.findIndex(asset => asset.id === options.after) + 1 : 0;
  const first = options.first ?? 20;
  const page = assets.slice(start, start + first);
  return {assets: page, endCursor: page.length ? page[page.length - 1].id : (options.after ?? ''), hasNextPage: start + first < assets.length, totalCount: assets.length};
}

/**
 * `ExpoMediaLibrary`, what `expo-media-library`'s functions call: the user's
 * Pictures, Videos and Music folders as the library, their folders as
 * albums, through the runtime's library. Windows asks no permission of a
 * desktop app for them, so access is granted in full; sorting, filtering
 * and paging happen here over the listing. What is another platform's —
 * moments, album migration, favourites — says so.
 */
export function createMediaLibraryModule() {
  const Base = nativeModuleClass();
  class Module extends Base<MediaLibraryEvents> {
    private subscription: EmitterSubscription | null = null;
    readonly CHANGE_LISTENER_NAME = 'mediaLibraryDidChange';
    readonly MediaType = {audio: 'audio', photo: 'photo', video: 'video', unknown: 'unknown'} as const;
    readonly SortBy = Object.fromEntries(SORT_KEYS.map(key => [key, key])) as Record<SortKey, SortKey>;

    async getPermissionsAsync(): Promise<PermissionResponse> {
      return ACCESS;
    }
    async requestPermissionsAsync(): Promise<PermissionResponse> {
      return ACCESS;
    }
    async presentPermissionsPickerAsync(): Promise<void> {}
    async createAssetAsync(localUri: string, albumId?: string): Promise<MediaAsset> {
      return library('createAssetAsync').createAsset(localUri, albumId ?? '');
    }
    async saveToLibraryAsync(localUri: string): Promise<void> {
      await library('saveToLibraryAsync').createAsset(localUri, '');
    }
    async addAssetsToAlbumAsync(assetIds: string[], albumId: string, copy = true): Promise<boolean> {
      return library('addAssetsToAlbumAsync').addAssetsToAlbum(assetIds, albumId, copy);
    }
    async removeAssetsFromAlbumAsync(assetIds: string[], albumId: string): Promise<boolean> {
      return library('removeAssetsFromAlbumAsync').removeAssetsFromAlbum(assetIds, albumId);
    }
    async deleteAssetsAsync(assetIds: string[]): Promise<boolean> {
      return library('deleteAssetsAsync').deleteAssets(assetIds);
    }
    async getAssetInfoAsync(assetId: string): Promise<MediaAssetInfo> {
      return library('getAssetInfoAsync').assetInfo(assetId);
    }
    async getAssetContentUriAsync(assetId: string): Promise<string> {
      return (await library('getAssetContentUriAsync').assetInfo(assetId)).uri;
    }
    async getAlbumsAsync(): Promise<MediaAlbum[]> {
      return library('getAlbumsAsync').albums();
    }
    async getAlbumAsync(title: string): Promise<MediaAlbum | null> {
      return (await library('getAlbumAsync').albums()).find(album => album.title === title) ?? null;
    }
    async createAlbumAsync(albumName: string, assetId?: string, copyAsset = true, initialAssetLocalUri?: string): Promise<MediaAlbum> {
      const mediaLibrary = library('createAlbumAsync');
      const album = await mediaLibrary.createAlbum(albumName, assetId ?? '', !copyAsset);
      if (assetId || !initialAssetLocalUri) return album;
      await mediaLibrary.createAsset(initialAssetLocalUri, album.id);
      return {...album, assetCount: album.assetCount + 1};
    }
    async deleteAlbumsAsync(albumIds: string[], deleteAssets = false): Promise<boolean> {
      return library('deleteAlbumsAsync').deleteAlbums(albumIds, deleteAssets);
    }
    async getAssetsAsync(options: AssetsOptions = {}): Promise<PagedAssets> {
      return pageAssets(await library('getAssetsAsync').assets(options.album ?? ''), options);
    }
    async getMomentsAsync(): Promise<never> {
      throw new UnavailabilityError('MediaLibrary', 'getMomentsAsync');
    }
    async migrateAlbumIfNeededAsync(): Promise<void> {}
    async albumNeedsMigrationAsync(): Promise<boolean> {
      return false;
    }
    async setAssetFavoriteAsync(): Promise<never> {
      throw new UnavailabilityError('MediaLibrary', 'setAssetFavoriteAsync');
    }
    startObserving(): void {
      this.subscription ??= DeviceEventEmitter.addListener('onMediaLibraryChange', (event: {hasIncrementalChanges: boolean}) => {
        this.emit('mediaLibraryDidChange', event);
      });
      native.mediaLibrary()?.watch(true);
    }
    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
      native.mediaLibrary()?.watch(false);
    }
  }
  return new Module();
}

/** The next API's media type for a kind: `photo` is `image` there. */
export function mediaTypeOf(kind: MediaKind): 'image' | 'video' | 'audio' | 'unknown' {
  return kind === 'photo' ? 'image' : kind;
}

export type AssetMetadata = {
  id: string;
  filename: string | null;
  mediaType: 'image' | 'video' | 'audio' | 'unknown';
  width: number | null;
  height: number | null;
  duration: number | null;
  creationTime: number | null;
  modificationTime: number | null;
  isFavorite: boolean;
};

export function metadataOf(asset: MediaAsset): AssetMetadata {
  const sized = asset.width > 0 || asset.height > 0;
  return {
    id: asset.id,
    filename: asset.filename,
    mediaType: mediaTypeOf(asset.mediaType),
    width: sized ? asset.width : null,
    height: sized ? asset.height : null,
    duration: asset.mediaType === 'video' || asset.mediaType === 'audio' ? asset.duration : null,
    creationTime: asset.creationTime,
    modificationTime: asset.modificationTime,
    isFavorite: false,
  };
}

type Field = keyof AssetMetadata;
type Predicate = (metadata: AssetMetadata) => boolean;

/**
 * `ExpoMediaLibraryNext`, what the package's `next` API is: `Asset`,
 * `Album` and `Query` classes over the same folders. A query collects its
 * conditions and runs them over the listing here; an asset reads its
 * fields from the file each time, as the native classes do.
 */
export function createMediaLibraryNextModule() {
  const Base = nativeModuleClass();
  const Shared = globalThis.expo.SharedObject as typeof SharedObject;
  const ids = (refs: ({id: string} | string)[] | {id: string} | string): string[] => asList(refs).map(ref => (typeof ref === 'string' ? ref : ref.id));

  class Asset extends Shared {
    constructor(readonly id: string) {
      super();
    }
    private info(method: string): Promise<MediaAssetInfo> {
      return library(method).assetInfo(this.id);
    }
    async getCreationTime(): Promise<number | null> {
      return (await this.info('getCreationTime')).creationTime;
    }
    async getDuration(): Promise<number | null> {
      return metadataOf(await this.info('getDuration')).duration;
    }
    async getFilename(): Promise<string> {
      return (await this.info('getFilename')).filename;
    }
    async getHeight(): Promise<number> {
      return (await this.info('getHeight')).height;
    }
    async getWidth(): Promise<number> {
      return (await this.info('getWidth')).width;
    }
    async getMediaType(): Promise<'image' | 'video' | 'audio' | 'unknown'> {
      return mediaTypeOf((await this.info('getMediaType')).mediaType);
    }
    async getMediaSubtypes(): Promise<string[]> {
      return [];
    }
    async getLivePhotoVideoUri(): Promise<null> {
      return null;
    }
    async getIsInCloud(): Promise<boolean> {
      return false;
    }
    async getOrientation(): Promise<number | null> {
      return (await this.info('getOrientation')).orientation ?? null;
    }
    async getModificationTime(): Promise<number | null> {
      return (await this.info('getModificationTime')).modificationTime;
    }
    async getShape(): Promise<{width: number; height: number} | null> {
      const {width, height} = metadataOf(await this.info('getShape'));
      return width === null || height === null ? null : {width, height};
    }
    async getUri(): Promise<string> {
      return (await this.info('getUri')).uri;
    }
    async getInfo(): Promise<AssetMetadata & {uri: string}> {
      const info = await this.info('getInfo');
      return {...metadataOf(info), uri: info.uri};
    }
    async getAlbums(): Promise<Album[]> {
      const {albumId} = await this.info('getAlbums');
      return albumId ? [new Album(albumId)] : [];
    }
    async getLocation(): Promise<{latitude: number; longitude: number} | null> {
      return (await this.info('getLocation')).location ?? null;
    }
    async getExif(): Promise<Record<string, unknown>> {
      return (await this.info('getExif')).exif;
    }
    async delete(): Promise<void> {
      await library('delete').deleteAssets([this.id]);
    }
    async getFavorite(): Promise<boolean> {
      return false;
    }
    async setFavorite(): Promise<never> {
      throw new UnavailabilityError('MediaLibrary', 'Asset.setFavorite');
    }
    static async create(filePath: string, album?: Album): Promise<Asset> {
      return new Asset((await library('Asset.create').createAsset(filePath, album?.id ?? '')).id);
    }
    static async delete(assets: Asset[]): Promise<void> {
      await library('Asset.delete').deleteAssets(ids(assets));
    }
  }

  class Album extends Shared {
    constructor(readonly id: string) {
      super();
    }
    async getAssets(): Promise<Asset[]> {
      return (await library('getAssets').assets(this.id)).map(asset => new Asset(asset.id));
    }
    async getTitle(): Promise<string> {
      return (await library('getTitle').albums()).find(album => album.id === this.id)?.title ?? (this.id.split(/[\\/]/).pop() as string);
    }
    async delete(): Promise<void> {
      await library('delete').deleteAlbums([this.id], false);
    }
    async add(assets: Asset | Asset[]): Promise<void> {
      await library('add').addAssetsToAlbum(ids(assets), this.id, false);
    }
    async removeAssets(assets: Asset[]): Promise<void> {
      await library('removeAssets').removeAssetsFromAlbum(ids(assets), this.id);
    }
    static async create(name: string, assetsRefs: (Asset | string)[], moveAssets = true): Promise<Album> {
      const mediaLibrary = library('Album.create');
      const [first, ...rest] = ids(assetsRefs);
      const album = await mediaLibrary.createAlbum(name, first ?? '', moveAssets);
      if (rest.length) await mediaLibrary.addAssetsToAlbum(rest, album.id, !moveAssets);
      return new Album(album.id);
    }
    static async delete(albums: Album[], deleteAssets = false): Promise<void> {
      await library('Album.delete').deleteAlbums(ids(albums), deleteAssets);
    }
    static async get(title: string): Promise<Album | null> {
      const found = (await library('Album.get').albums()).find(album => album.title === title);
      return found ? new Album(found.id) : null;
    }
    static async getAll(): Promise<Album[]> {
      return (await library('Album.getAll').albums()).map(album => new Album(album.id));
    }
  }

  class Query extends Shared {
    private predicates: Predicate[] = [];
    private sort: {key: Field; ascending: boolean}[] = [];
    private start = 0;
    private count = Infinity;
    private within_?: string;

    private where(predicate: Predicate): this {
      this.predicates.push(predicate);
      return this;
    }
    eq(field: Field, value: unknown): this {
      return this.where(metadata => metadata[field] === value);
    }
    within(field: Field, values: unknown[]): this {
      return this.where(metadata => values.includes(metadata[field]));
    }
    gt(field: Field, value: number): this {
      return this.where(metadata => Number(metadata[field]) > value);
    }
    gte(field: Field, value: number): this {
      return this.where(metadata => Number(metadata[field]) >= value);
    }
    lt(field: Field, value: number): this {
      return this.where(metadata => Number(metadata[field]) < value);
    }
    lte(field: Field, value: number): this {
      return this.where(metadata => Number(metadata[field]) <= value);
    }
    limit(limit: number): this {
      this.count = limit;
      return this;
    }
    offset(offset: number): this {
      this.start = offset;
      return this;
    }
    orderBy(sortDescriptors: {key: Field; ascending?: boolean} | Field): this {
      const descriptor = typeof sortDescriptors === 'string' ? {key: sortDescriptors} : sortDescriptors;
      this.sort.push({key: descriptor.key, ascending: descriptor.ascending ?? true});
      return this;
    }
    album(album: Album): this {
      this.within_ = album.id;
      return this;
    }
    async exeForMetadata(): Promise<AssetMetadata[]> {
      const all = (await library('Query.exe').assets(this.within_ ?? '')).map(metadataOf);
      const matching = all.filter(metadata => this.predicates.every(predicate => predicate(metadata)));
      const sorted = matching.sort((a, b) => {
        for (const {key, ascending} of this.sort) {
          const left = a[key] ?? 0;
          const right = b[key] ?? 0;
          if (left === right) continue;
          return (left < right ? -1 : 1) * (ascending ? 1 : -1);
        }
        return 0;
      });
      return sorted.slice(this.start, this.start + this.count);
    }
    async exe(): Promise<Asset[]> {
      return (await this.exeForMetadata()).map(metadata => new Asset(metadata.id));
    }
  }

  class Module extends Base<MediaLibraryEvents> {
    private subscription: EmitterSubscription | null = null;
    readonly Asset = Asset;
    readonly Album = Album;
    readonly Query = Query;
    async getPermissionsAsync(): Promise<PermissionResponse> {
      return ACCESS;
    }
    async requestPermissionsAsync(): Promise<PermissionResponse> {
      return ACCESS;
    }
    async presentPermissionsPicker(): Promise<void> {}
    startObserving(): void {
      this.subscription ??= DeviceEventEmitter.addListener('onMediaLibraryChange', (event: {hasIncrementalChanges: boolean}) => {
        this.emit('mediaLibraryDidChange', event);
      });
      native.mediaLibrary()?.watch(true);
    }
    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
      native.mediaLibrary()?.watch(false);
    }
  }
  return new Module();
}

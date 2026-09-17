import type {MediaAlbum, MediaAsset, MediaAssetInfo, NativeMediaLibrary} from '../native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {createMediaLibraryModule, createMediaLibraryNextModule, mediaTypeOf, metadataOf, pageAssets, sortAssets} from './media-library';

const PICTURES = 'C:\\Users\\me\\Pictures';
const TRIP = `${PICTURES}\\Trip`;

function asset(name: string, overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {id: `${PICTURES}\\${name}`, filename: name, uri: `file:///C:/Users/me/Pictures/${name}`, mediaType: 'photo', width: 40, height: 30, creationTime: 1000, modificationTime: 2000, duration: 0, albumId: null, ...overrides};
}

const ASSETS: MediaAsset[] = [
  asset('a.jpg', {creationTime: 3000}),
  asset('b.mp4', {mediaType: 'video', creationTime: 2000, duration: 12.5, albumId: TRIP, id: `${TRIP}\\b.mp4`}),
  asset('c.mp3', {mediaType: 'audio', creationTime: 1000, width: 0, height: 0, duration: 200}),
  asset('d.jpg', {creationTime: 4000, width: 10, height: 10}),
];

/** A library over a list of assets and one album, recording what it is asked to change. */
function withLibrary() {
  const calls: unknown[][] = [];
  const record = <T>(name: string, value: T) => vi.fn(async (...args: unknown[]) => (calls.push([name, ...args]), value));
  const albums: MediaAlbum[] = [{id: TRIP, title: 'Trip', assetCount: 1, type: 'album', startTime: 0, endTime: 0}];
  const info = (id: string): MediaAssetInfo => {
    const found = ASSETS.find(entry => entry.id === id);
    if (!found) throw new Error('The file could not be found');
    return {...found, localUri: found.uri, exif: {Orientation: 1}, isFavorite: false, ...(found.mediaType === 'photo' ? {orientation: 1, location: {latitude: 1, longitude: 2}} : {})};
  };
  const library: NativeMediaLibrary = {
    assets: vi.fn(async (album: string) => (album ? ASSETS.filter(entry => entry.albumId === album) : ASSETS)),
    assetInfo: vi.fn(async (id: string) => info(id)),
    albums: vi.fn(async () => albums),
    createAsset: record('createAsset', asset('new.jpg', {albumId: TRIP, id: `${TRIP}\\new.jpg`})),
    createAlbum: record('createAlbum', {id: `${PICTURES}\\Fresh`, title: 'Fresh', assetCount: 1, type: 'album', startTime: 0, endTime: 0} as MediaAlbum),
    deleteAssets: record('deleteAssets', true),
    deleteAlbums: record('deleteAlbums', true),
    addAssetsToAlbum: record('addAssetsToAlbum', true),
    removeAssetsFromAlbum: record('removeAssetsFromAlbum', true),
    watch: vi.fn(),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsMediaLibrary' ? library : null) as never);
  return {library, calls};
}

describe('media library (windows)', () => {
  it('sorts as asked, newest first by default, and pages with a cursor and filters', () => {
    expect(sortAssets(ASSETS, undefined).map(entry => entry.filename)).toEqual(['d.jpg', 'a.jpg', 'b.mp4', 'c.mp3']);
    expect(sortAssets(ASSETS, ['default', false]).map(entry => entry.filename)).toEqual(['d.jpg', 'a.jpg', 'b.mp4', 'c.mp3']);
    expect(sortAssets(ASSETS, ['default', true]).map(entry => entry.filename)).toEqual(['c.mp3', 'b.mp4', 'a.jpg', 'd.jpg']);
    expect(sortAssets(ASSETS, 'duration').map(entry => entry.filename)).toEqual(['c.mp3', 'b.mp4', 'a.jpg', 'd.jpg']);
    expect(sortAssets(ASSETS, 'duration ASC').map(entry => entry.filename)).toEqual(['a.jpg', 'd.jpg', 'b.mp4', 'c.mp3']);
    expect(sortAssets(ASSETS, ['width DESC', 'creationTime ASC']).map(entry => entry.filename)).toEqual(['b.mp4', 'a.jpg', 'd.jpg', 'c.mp3']);
    expect(sortAssets(ASSETS, [['mediaType', true], 'creationTime']).map(entry => entry.filename)).toEqual(['c.mp3', 'd.jpg', 'a.jpg', 'b.mp4']);
    const first = pageAssets(ASSETS, {first: 2});
    expect(first).toMatchObject({endCursor: `${PICTURES}\\a.jpg`, hasNextPage: true, totalCount: 4});
    expect(first.assets.map(entry => entry.filename)).toEqual(['d.jpg', 'a.jpg']);
    const second = pageAssets(ASSETS, {first: 2, after: first.endCursor});
    expect(second.assets.map(entry => entry.filename)).toEqual(['b.mp4', 'c.mp3']);
    expect(second.hasNextPage).toBe(false);
    expect(pageAssets(ASSETS, {first: 2, after: second.endCursor})).toEqual({assets: [], endCursor: second.endCursor, hasNextPage: false, totalCount: 4});
    expect(pageAssets([], {}).endCursor).toBe('');
    expect(pageAssets(ASSETS, {mediaType: 'video'}).assets.map(entry => entry.filename)).toEqual(['b.mp4']);
    expect(pageAssets(ASSETS, {mediaType: ['photo', 'audio'], createdAfter: 1000, createdBefore: 4000}).assets.map(entry => entry.filename)).toEqual(['a.jpg']);
  });

  it('answers the legacy functions over the library', async () => {
    const {library, calls} = withLibrary();
    const module = createMediaLibraryModule();
    expect(module.CHANGE_LISTENER_NAME).toBe('mediaLibraryDidChange');
    expect(module.MediaType.photo).toBe('photo');
    expect(module.SortBy.creationTime).toBe('creationTime');
    await expect(module.getPermissionsAsync()).resolves.toMatchObject({granted: true, accessPrivileges: 'all'});
    await expect(module.requestPermissionsAsync()).resolves.toMatchObject({granted: true});
    await expect(module.presentPermissionsPickerAsync()).resolves.toBeUndefined();
    await expect(module.createAssetAsync('file:///C:/new.jpg')).resolves.toMatchObject({filename: 'new.jpg'});
    await module.createAssetAsync('file:///C:/new.jpg', TRIP);
    await module.saveToLibraryAsync('file:///C:/new.jpg');
    await expect(module.addAssetsToAlbumAsync(['x'], TRIP)).resolves.toBe(true);
    await module.addAssetsToAlbumAsync(['x'], TRIP, false);
    await expect(module.removeAssetsFromAlbumAsync(['x'], TRIP)).resolves.toBe(true);
    await expect(module.deleteAssetsAsync(['x'])).resolves.toBe(true);
    await expect(module.getAssetInfoAsync(`${PICTURES}\\a.jpg`)).resolves.toMatchObject({filename: 'a.jpg', exif: {Orientation: 1}});
    await expect(module.getAssetContentUriAsync(`${PICTURES}\\a.jpg`)).resolves.toBe('file:///C:/Users/me/Pictures/a.jpg');
    await expect(module.getAlbumsAsync()).resolves.toHaveLength(1);
    await expect(module.getAlbumAsync('Trip')).resolves.toMatchObject({id: TRIP});
    await expect(module.getAlbumAsync('Nope')).resolves.toBeNull();
    await expect(module.createAlbumAsync('Fresh', `${PICTURES}\\a.jpg`)).resolves.toMatchObject({title: 'Fresh', assetCount: 1});
    await module.createAlbumAsync('Fresh', `${PICTURES}\\a.jpg`, false);
    await expect(module.createAlbumAsync('Fresh', undefined, true, 'file:///C:/new.jpg')).resolves.toMatchObject({assetCount: 2});
    await expect(module.createAlbumAsync('Fresh')).resolves.toMatchObject({assetCount: 1});
    await expect(module.deleteAlbumsAsync([TRIP])).resolves.toBe(true);
    await module.deleteAlbumsAsync([TRIP], true);
    const page = await module.getAssetsAsync({album: TRIP});
    expect(page.assets.map(entry => entry.filename)).toEqual(['b.mp4']);
    expect((await module.getAssetsAsync()).totalCount).toBe(4);
    expect(library.assets).toHaveBeenLastCalledWith('');
    await expect(module.getMomentsAsync()).rejects.toThrow(/MediaLibrary.getMomentsAsync/);
    await expect(module.migrateAlbumIfNeededAsync()).resolves.toBeUndefined();
    await expect(module.albumNeedsMigrationAsync()).resolves.toBe(false);
    await expect(module.setAssetFavoriteAsync()).rejects.toThrow(/MediaLibrary.setAssetFavoriteAsync/);
    expect(calls).toEqual([
      ['createAsset', 'file:///C:/new.jpg', ''],
      ['createAsset', 'file:///C:/new.jpg', TRIP],
      ['createAsset', 'file:///C:/new.jpg', ''],
      ['addAssetsToAlbum', ['x'], TRIP, true],
      ['addAssetsToAlbum', ['x'], TRIP, false],
      ['removeAssetsFromAlbum', ['x'], TRIP],
      ['deleteAssets', ['x']],
      ['createAlbum', 'Fresh', `${PICTURES}\\a.jpg`, false],
      ['createAlbum', 'Fresh', `${PICTURES}\\a.jpg`, true],
      ['createAlbum', 'Fresh', '', false],
      ['createAsset', 'file:///C:/new.jpg', `${PICTURES}\\Fresh`],
      ['createAlbum', 'Fresh', '', false],
      ['deleteAlbums', [TRIP], false],
      ['deleteAlbums', [TRIP], true],
    ]);
  });

  it('relays the shell change notification while listened to, and says when the library is missing', async () => {
    const {library} = withLibrary();
    const module = createMediaLibraryModule();
    const heard: unknown[] = [];
    module.addListener('mediaLibraryDidChange', event => heard.push(event));
    module.startObserving();
    module.startObserving();
    expect(library.watch).toHaveBeenCalledWith(true);
    DeviceEventEmitter.emit('onMediaLibraryChange', {hasIncrementalChanges: false});
    expect(heard).toEqual([{hasIncrementalChanges: false}]);
    module.stopObserving();
    expect(library.watch).toHaveBeenLastCalledWith(false);
    DeviceEventEmitter.emit('onMediaLibraryChange', {hasIncrementalChanges: false});
    expect(heard).toHaveLength(1);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    module.startObserving();
    module.stopObserving();
    await expect(module.getAlbumsAsync()).rejects.toThrow(/MediaLibrary.getAlbumsAsync/);
    const next = createMediaLibraryNextModule();
    const heardNext: unknown[] = [];
    next.addListener('mediaLibraryDidChange', event => heardNext.push(event));
    next.startObserving();
    DeviceEventEmitter.emit('onMediaLibraryChange', {hasIncrementalChanges: false});
    next.stopObserving();
    expect(heardNext).toEqual([{hasIncrementalChanges: false}]);
    await expect(next.Album.getAll()).rejects.toThrow(/MediaLibrary.Album.getAll/);
  });

  it('maps kinds and metadata for the next API', () => {
    expect(mediaTypeOf('photo')).toBe('image');
    expect(mediaTypeOf('video')).toBe('video');
    expect(metadataOf(ASSETS[0])).toEqual({id: ASSETS[0].id, filename: 'a.jpg', mediaType: 'image', width: 40, height: 30, duration: null, creationTime: 3000, modificationTime: 2000, isFavorite: false});
    expect(metadataOf(ASSETS[2])).toMatchObject({mediaType: 'audio', width: null, height: null, duration: 200});
  });

  it('reads an asset field by field, and creates and deletes through the library', async () => {
    const {library, calls} = withLibrary();
    const next = createMediaLibraryNextModule();
    await expect(next.getPermissionsAsync()).resolves.toMatchObject({accessPrivileges: 'all'});
    await expect(next.requestPermissionsAsync()).resolves.toMatchObject({granted: true});
    await expect(next.presentPermissionsPicker()).resolves.toBeUndefined();
    const photo = new next.Asset(`${PICTURES}\\a.jpg`);
    await expect(photo.getCreationTime()).resolves.toBe(3000);
    await expect(photo.getDuration()).resolves.toBeNull();
    await expect(photo.getFilename()).resolves.toBe('a.jpg');
    await expect(photo.getHeight()).resolves.toBe(30);
    await expect(photo.getWidth()).resolves.toBe(40);
    await expect(photo.getMediaType()).resolves.toBe('image');
    await expect(photo.getMediaSubtypes()).resolves.toEqual([]);
    await expect(photo.getLivePhotoVideoUri()).resolves.toBeNull();
    await expect(photo.getIsInCloud()).resolves.toBe(false);
    await expect(photo.getOrientation()).resolves.toBe(1);
    await expect(photo.getModificationTime()).resolves.toBe(2000);
    await expect(photo.getShape()).resolves.toEqual({width: 40, height: 30});
    await expect(photo.getUri()).resolves.toBe('file:///C:/Users/me/Pictures/a.jpg');
    await expect(photo.getInfo()).resolves.toMatchObject({mediaType: 'image', uri: 'file:///C:/Users/me/Pictures/a.jpg'});
    await expect(photo.getAlbums()).resolves.toEqual([]);
    await expect(photo.getLocation()).resolves.toEqual({latitude: 1, longitude: 2});
    await expect(photo.getExif()).resolves.toEqual({Orientation: 1});
    await expect(photo.getFavorite()).resolves.toBe(false);
    await expect(photo.setFavorite()).rejects.toThrow(/Asset.setFavorite/);
    const clip = new next.Asset(`${TRIP}\\b.mp4`);
    await expect(clip.getDuration()).resolves.toBe(12.5);
    await expect(clip.getOrientation()).resolves.toBeNull();
    await expect(clip.getLocation()).resolves.toBeNull();
    const [album] = await clip.getAlbums();
    expect(album.id).toBe(TRIP);
    const song = new next.Asset(`${PICTURES}\\c.mp3`);
    await expect(song.getShape()).resolves.toBeNull();
    await expect(new next.Asset('C:\\missing.jpg').getUri()).rejects.toThrow(/could not be found/);
    await photo.delete();
    const created = await next.Asset.create('file:///C:/new.jpg', album);
    expect(created.id).toBe(`${TRIP}\\new.jpg`);
    await next.Asset.create('file:///C:/new.jpg');
    await next.Asset.delete([created, clip]);
    expect(calls).toEqual([
      ['deleteAssets', [`${PICTURES}\\a.jpg`]],
      ['createAsset', 'file:///C:/new.jpg', TRIP],
      ['createAsset', 'file:///C:/new.jpg', ''],
      ['deleteAssets', [`${TRIP}\\new.jpg`, `${TRIP}\\b.mp4`]],
    ]);
    expect(library.assetInfo).toHaveBeenCalled();
  });

  it('lists, titles, fills and removes albums', async () => {
    const {calls} = withLibrary();
    const next = createMediaLibraryNextModule();
    const trip = new next.Album(TRIP);
    expect((await trip.getAssets()).map(entry => entry.id)).toEqual([`${TRIP}\\b.mp4`]);
    await expect(trip.getTitle()).resolves.toBe('Trip');
    await expect(new next.Album(`${PICTURES}\\Other`).getTitle()).resolves.toBe('Other');
    const photo = new next.Asset(`${PICTURES}\\a.jpg`);
    await trip.add(photo);
    await trip.add([photo]);
    await trip.removeAssets([photo]);
    await trip.delete();
    const fresh = await next.Album.create('Fresh', [photo, `${PICTURES}\\d.jpg`]);
    expect(fresh.id).toBe(`${PICTURES}\\Fresh`);
    await next.Album.create('Fresh', [], false);
    await next.Album.delete([fresh], true);
    await next.Album.delete([fresh]);
    expect((await next.Album.get('Trip'))?.id).toBe(TRIP);
    await expect(next.Album.get('Nope')).resolves.toBeNull();
    expect((await next.Album.getAll()).map(album => album.id)).toEqual([TRIP]);
    expect(calls).toEqual([
      ['addAssetsToAlbum', [`${PICTURES}\\a.jpg`], TRIP, false],
      ['addAssetsToAlbum', [`${PICTURES}\\a.jpg`], TRIP, false],
      ['removeAssetsFromAlbum', [`${PICTURES}\\a.jpg`], TRIP],
      ['deleteAlbums', [TRIP], false],
      ['createAlbum', 'Fresh', `${PICTURES}\\a.jpg`, true],
      ['addAssetsToAlbum', [`${PICTURES}\\d.jpg`], `${PICTURES}\\Fresh`, false],
      ['createAlbum', 'Fresh', '', false],
      ['deleteAlbums', [`${PICTURES}\\Fresh`], true],
      ['deleteAlbums', [`${PICTURES}\\Fresh`], false],
    ]);
  });

  it('runs a query over the listing: conditions, order, offset and limit, within an album', async () => {
    const {library} = withLibrary();
    const next = createMediaLibraryNextModule();
    const names = async (query: InstanceType<typeof next.Query>) => (await query.exeForMetadata()).map(metadata => metadata.filename);
    await expect(names(new next.Query().eq('mediaType', 'image').orderBy('creationTime'))).resolves.toEqual(['a.jpg', 'd.jpg']);
    await expect(names(new next.Query().within('mediaType', ['video', 'audio']).orderBy({key: 'duration', ascending: false}))).resolves.toEqual(['c.mp3', 'b.mp4']);
    await expect(names(new next.Query().gt('creationTime', 1000).gte('width', 10).lt('creationTime', 4000).lte('height', 30).orderBy('width').orderBy('filename'))).resolves.toEqual(['a.jpg', 'b.mp4']);
    await expect(names(new next.Query().orderBy({key: 'creationTime', ascending: false}).offset(1).limit(2))).resolves.toEqual(['a.jpg', 'b.mp4']);
    await expect(names(new next.Query().orderBy('isFavorite'))).resolves.toHaveLength(4);
    await expect(names(new next.Query().orderBy({key: 'duration', ascending: false}).limit(2))).resolves.toEqual(['c.mp3', 'b.mp4']);
    const inTrip = await new next.Query().album(new next.Album(TRIP)).exe();
    expect(inTrip.map(entry => entry.id)).toEqual([`${TRIP}\\b.mp4`]);
    expect(inTrip[0]).toBeInstanceOf(next.Asset);
    expect(library.assets).toHaveBeenLastCalledWith(TRIP);
  });
});

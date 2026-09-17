import type {NativeFileSystem, NativeImages} from '../native';
import {TurboModuleRegistry} from 'react-native';
import {assetOf as documentAssetOf, ExpoDocumentPicker, isCancellation} from './document-picker';
import {createImageManipulatorModule, sourceUri} from './image-manipulator';
import {assetOf as imageAssetOf, ExponentImagePicker, mimeTypesFor} from './image-picker';

const CACHE = 'file:///C:/Users/me/AppData/Local/Drops/cache/';

/** The file system and the image library the pickers and the manipulator lean on. */
function withLibraries({cache = CACHE, cancel = false}: {cache?: string | null; cancel?: boolean} = {}) {
  const copies: string[] = [];
  const fileSystem = {
    getConstants: () => ({cacheDirectory: cache, documentDirectory: '', bundleDirectory: '', totalDiskSpace: 0, availableDiskSpace: 0}),
    info: (uri: string) => ({value: {exists: true, isDirectory: false, uri, size: 12, modificationTime: 1234, creationTime: 100, type: uri.endsWith('.txt') ? 'text/plain' : ''}}),
    copy: (from: string, to: string) => {
      copies.push(to);
      return {value: to};
    },
    readBase64: () => ({value: 'AQID'}),
    pickFile: vi.fn(async (_initial: string, _types: string[], multiple: boolean) => {
      if (cancel) throw new Error('The user did not pick a file');
      return multiple ? [{uri: 'file:///C:/a.txt'}, {uri: 'file:///C:/b.png'}, {uri: 'file:///C:/c.mp4'}] : {uri: 'file:///C:/a.txt'};
    }),
  } as unknown as NativeFileSystem;
  const images: NativeImages = {
    info: vi.fn(async (uri: string) => {
      if (uri.includes('broken')) throw new Error('No decoder');
      return {width: 40, height: 30};
    }),
    manipulate: vi.fn(async (uri: string, actions: unknown[], format: string, compress: number, base64: boolean) => ({uri: `${uri}#${actions.length}.${format}@${compress}`, width: 4, height: 3, ...(base64 ? {base64: 'AQID'} : {})})),
    capture: vi.fn(async (video: boolean) => (cancel ? null : {uri: video ? 'file:///C:/clip.mp4' : 'file:///C:/shot.jpg'})),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsFileSystem' ? fileSystem : name === 'ExpoWindowsImages' ? images : null) as never);
  return {fileSystem, images, copies};
}

describe('document picker (windows)', () => {
  it('picks one file, copies it into the cache and describes it', async () => {
    const {fileSystem, copies} = withLibraries();
    const result = await ExpoDocumentPicker.getDocumentAsync();
    expect(result).toEqual({canceled: false, assets: [{uri: `${CACHE}DocumentPicker/a.txt`, name: 'a.txt', size: 12, mimeType: 'text/plain', lastModified: 1234}]});
    expect(copies).toEqual([`${CACHE}DocumentPicker/a.txt`]);
    expect(fileSystem.pickFile).toHaveBeenCalledWith('', [], false);
    const many = await ExpoDocumentPicker.getDocumentAsync({multiple: true, type: ['image/*'], copyToCacheDirectory: false});
    expect(many.assets?.map(asset => asset.uri)).toEqual(['file:///C:/a.txt', 'file:///C:/b.png', 'file:///C:/c.mp4']);
    expect(many.assets?.[1]).not.toHaveProperty('mimeType');
    expect(fileSystem.pickFile).toHaveBeenLastCalledWith('', ['image/*'], true);
  });

  it('answers canceled when the user leaves the picker, keeps the file where it is without a cache, and passes other failures on', async () => {
    withLibraries({cancel: true});
    await expect(ExpoDocumentPicker.getDocumentAsync()).resolves.toEqual({canceled: true, assets: null});
    const {fileSystem, copies} = withLibraries({cache: null});
    expect(documentAssetOf(fileSystem, 'file:///C:/a.txt', true).uri).toBe('file:///C:/a.txt');
    expect(copies).toEqual([]);
    expect(isCancellation(new Error('boom'))).toBe(false);
    expect(isCancellation('nope')).toBe(false);
    vi.mocked(fileSystem.pickFile).mockRejectedValueOnce(new Error('boom'));
    await expect(ExpoDocumentPicker.getDocumentAsync()).rejects.toThrow('boom');
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(ExpoDocumentPicker.getDocumentAsync()).rejects.toThrow(/DocumentPicker.getDocumentAsync/);
  });
});

describe('image picker (windows)', () => {
  it('maps media types onto MIME families', () => {
    expect(mimeTypesFor(undefined)).toEqual(['image/*']);
    expect(mimeTypesFor('videos')).toEqual(['video/*']);
    expect(mimeTypesFor(['images', 'videos'])).toEqual(['image/*', 'video/*']);
    expect(mimeTypesFor('All')).toEqual(['image/*', 'video/*']);
    expect(mimeTypesFor('livePhotos')).toEqual(['image/*']);
  });

  it('grants the permissions, picks from the library with sizes, base64 and a selection limit, and answers canceled', async () => {
    const {fileSystem, images} = withLibraries();
    await expect(ExponentImagePicker.getCameraPermissionsAsync()).resolves.toMatchObject({granted: true});
    await expect(ExponentImagePicker.requestCameraPermissionsAsync()).resolves.toMatchObject({granted: true});
    await expect(ExponentImagePicker.getMediaLibraryPermissionsAsync()).resolves.toMatchObject({granted: true});
    await expect(ExponentImagePicker.requestMediaLibraryPermissionsAsync()).resolves.toMatchObject({granted: true});
    const one = await ExponentImagePicker.launchImageLibraryAsync({base64: true});
    expect(one).toEqual({canceled: false, assets: [{uri: 'file:///C:/a.txt', width: 40, height: 30, type: 'image', fileName: 'a.txt', fileSize: 12, mimeType: 'text/plain', assetId: null, base64: 'AQID'}]});
    const many = await ExponentImagePicker.launchImageLibraryAsync({mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 3});
    expect(many.assets?.map(asset => [asset.type, asset.width, asset.duration])).toEqual([
      ['image', 40, undefined],
      ['image', 40, undefined],
      ['video', 0, null],
    ]);
    expect(fileSystem.pickFile).toHaveBeenLastCalledWith('', ['image/*', 'video/*'], true);
    const limited = await ExponentImagePicker.launchImageLibraryAsync({allowsMultipleSelection: true, selectionLimit: 1});
    expect(limited.assets).toHaveLength(1);
    expect(images.info).toHaveBeenCalledWith('file:///C:/a.txt');
    expect((await imageAssetOf(fileSystem, images, 'file:///C:/broken.png', false)).width).toBe(0);
    withLibraries({cancel: true});
    await expect(ExponentImagePicker.launchImageLibraryAsync()).resolves.toEqual({canceled: true, assets: null});
    await expect(ExponentImagePicker.launchCameraAsync()).resolves.toEqual({canceled: true, assets: null});
    const {fileSystem: failing} = withLibraries();
    vi.mocked(failing.pickFile).mockRejectedValueOnce(new Error('boom'));
    await expect(ExponentImagePicker.launchImageLibraryAsync()).rejects.toThrow('boom');
  });

  it('captures a photo or a video through the camera UI, and says when the libraries are missing', async () => {
    const {images} = withLibraries();
    const photo = await ExponentImagePicker.launchCameraAsync();
    expect(photo.assets?.[0]).toMatchObject({uri: 'file:///C:/shot.jpg', type: 'image', width: 40});
    expect(images.capture).toHaveBeenLastCalledWith(false);
    const video = await ExponentImagePicker.launchCameraAsync({mediaTypes: 'videos'});
    expect(video.assets?.[0]).toMatchObject({uri: 'file:///C:/clip.mp4', type: 'video', duration: null});
    expect(images.capture).toHaveBeenLastCalledWith(true);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    await expect(ExponentImagePicker.launchCameraAsync()).rejects.toThrow(/ImagePicker.launchCameraAsync/);
  });
});

describe('image manipulator (windows)', () => {
  it('collects actions into one render, and saves the rendered image as asked', async () => {
    const {images} = withLibraries();
    const module = createImageManipulatorModule();
    const context = module.manipulate('file:///C:/in.png').resize({width: 10}).rotate(90).flip('vertical').crop({originX: 0, originY: 0, width: 5, height: 5}).extent({});
    const rendered = await context.renderAsync();
    expect(images.manipulate).toHaveBeenLastCalledWith('file:///C:/in.png', [{resize: {width: 10}}, {rotate: 90}, {flip: 'vertical'}, {crop: {originX: 0, originY: 0, width: 5, height: 5}}, {extent: {}}], 'png', 1, false);
    expect(rendered).toMatchObject({uri: 'file:///C:/in.png#5.png@1', width: 4, height: 3, nativeRefType: 'image'});
    await expect(rendered.saveAsync({format: 'jpeg', compress: 0.5, base64: true})).resolves.toEqual({uri: 'file:///C:/in.png#5.png@1#0.jpeg@0.5', width: 4, height: 3, base64: 'AQID'});
    await expect(rendered.saveAsync()).resolves.toEqual({uri: 'file:///C:/in.png#5.png@1#0.jpeg@1', width: 4, height: 3});
    expect(images.manipulate).toHaveBeenLastCalledWith('file:///C:/in.png#5.png@1', [], 'jpeg', 1, false);
    await context.reset().renderAsync();
    expect(images.manipulate).toHaveBeenLastCalledWith('file:///C:/in.png', [], 'png', 1, false);
    expect(new module.Image('file:///C:/x.png', 1, 2)).toMatchObject({uri: 'file:///C:/x.png', width: 1, height: 2});
    expect(module.manipulate({uri: 'file:///C:/y.png'})).toBeInstanceOf(module.Context);
  });

  it('takes a string or an image with a URI, and says when the library is missing', async () => {
    expect(sourceUri('file:///C:/a.png')).toBe('file:///C:/a.png');
    expect(sourceUri({uri: 'file:///C:/b.png'})).toBe('file:///C:/b.png');
    expect(() => sourceUri({})).toThrow(/file URI/);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createImageManipulatorModule();
    await expect(module.manipulate('file:///C:/a.png').renderAsync()).rejects.toThrow(/ImageManipulator.renderAsync/);
    await expect(new module.Image('file:///C:/a.png', 1, 1).saveAsync()).rejects.toThrow(/ImageManipulator.saveAsync/);
  });
});

import {TurboModuleRegistry} from 'react-native';
import {createCameraModule, permissionOf} from './camera';
import {DENIED, GRANTED} from './permissions';

function withLibrary(count = 1, access = 'Allowed', requested = 'Allowed') {
  const library = {count: vi.fn(async () => count), access: vi.fn(async () => access), requestAccess: vi.fn(async () => requested)};
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsCamera' ? library : null) as never);
  return library;
}

describe('ExpoCamera (windows)', () => {
  it('says whether the machine has a camera, and the permissions as the privacy settings say', async () => {
    const library = withLibrary(2, 'UserPromptRequired', 'DeniedByUser');
    const module = createCameraModule();
    await expect(module.isAvailableAsync()).resolves.toBe(true);
    await expect(module.getCameraPermissionsAsync()).resolves.toMatchObject({status: 'undetermined', canAskAgain: true});
    expect(library.access).toHaveBeenCalledWith('webcam');
    await expect(module.requestCameraPermissionsAsync()).resolves.toBe(DENIED);
    expect(library.requestAccess).toHaveBeenCalledWith('webcam');
    await expect(module.getMicrophonePermissionsAsync()).resolves.toMatchObject({status: 'undetermined'});
    expect(library.access).toHaveBeenLastCalledWith('microphone');
    await expect(module.requestMicrophonePermissionsAsync()).resolves.toBe(DENIED);
    expect(library.requestAccess).toHaveBeenLastCalledWith('microphone');
    await expect(module.getAvailableVideoCodecsAsync()).resolves.toEqual(['h264']);
    expect(module.isModernBarcodeScannerAvailable).toBe(false);
    expect(module.toggleRecordingAsyncAvailable).toBe(false);
    expect(permissionOf('Allowed')).toBe(GRANTED);
    expect(permissionOf('DeniedBySystem')).toBe(DENIED);
    expect(permissionOf('NotDeclaredByApp')).toBe(DENIED);
  });

  it('says barcode scanning and the picture reference are other platforms\'', () => {
    withLibrary();
    const module = createCameraModule() as ReturnType<typeof createCameraModule> & Record<string, () => never> & {Picture: new () => object};
    expect(() => module.scanFromURLAsync()).toThrow(/Camera\.scanFromURLAsync/);
    expect(() => module.launchScanner()).toThrow(/Camera\.launchScanner/);
    expect(() => module.dismissScanner()).toThrow(/Camera\.dismissScanner/);
    expect(() => new module.Picture()).toThrow(/Camera\.Picture/);
  });

  it('has no camera, and permissions denied, without the library', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createCameraModule();
    await expect(module.isAvailableAsync()).resolves.toBe(false);
    await expect(module.getCameraPermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.requestCameraPermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.getMicrophonePermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.requestMicrophonePermissionsAsync()).resolves.toBe(DENIED);
    await expect(module.getAvailableVideoCodecsAsync()).resolves.toEqual([]);
  });
});

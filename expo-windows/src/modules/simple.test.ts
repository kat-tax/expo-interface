import {ExpoAsset} from './asset';
import {ExpoDevice} from './device';
import {ExpoKeepAwake} from './keep-awake';
import {ExpoSharing} from './sharing';
import {ExpoSystemUI} from './system-ui';

describe('ExpoAsset (windows)', () => {
  it('answers with the URL as the local URI, as web does', async () => {
    await expect(ExpoAsset.downloadAsync('http://localhost:8081/assets/a.png', null, 'png')).resolves.toBe(
      'http://localhost:8081/assets/a.png',
    );
  });
});

describe('ExpoSystemUI (windows)', () => {
  it('keeps the background color it is given', async () => {
    await expect(ExpoSystemUI.getBackgroundColorAsync()).resolves.toBeNull();
    await ExpoSystemUI.setBackgroundColorAsync('#202020');
    await expect(ExpoSystemUI.getBackgroundColorAsync()).resolves.toBe('#202020');
    await ExpoSystemUI.setBackgroundColorAsync(null);
    await expect(ExpoSystemUI.getBackgroundColorAsync()).resolves.toBeNull();
  });
});

describe('ExpoKeepAwake (windows)', () => {
  it('is unavailable and takes the tags without effect', async () => {
    await expect(ExpoKeepAwake.isAvailableAsync()).resolves.toBe(false);
    await expect(ExpoKeepAwake.activate('dev')).resolves.toBeUndefined();
    await expect(ExpoKeepAwake.deactivate('dev')).resolves.toBeUndefined();
    const subscription = ExpoKeepAwake.addListenerForTag('dev', vi.fn());
    expect(() => subscription.remove()).not.toThrow();
  });
});

describe('ExpoSharing (windows)', () => {
  it('reports itself unavailable and throws the package\'s error when asked anyway', async () => {
    await expect(ExpoSharing.isAvailableAsync()).resolves.toBe(false);
    await expect(ExpoSharing.shareAsync('file:///a.txt')).rejects.toThrow(/shareAsync/);
    expect(() => ExpoSharing.getSharedPayloads()).toThrow(/getSharedPayloads/);
    await expect(ExpoSharing.getResolvedSharedPayloadsAsync()).rejects.toThrow(/getResolvedSharedPayloadsAsync/);
    expect(() => ExpoSharing.clearSharedPayloads()).not.toThrow();
  });
});

describe('ExpoDevice (windows)', () => {
  it('is a desktop running Windows, with the rest unknown until the C++ module', async () => {
    expect(ExpoDevice).toMatchObject({isDevice: true, osName: 'Windows', deviceType: 3, modelName: null, totalMemory: null});
    expect(typeof ExpoDevice.osVersion).toBe('string');
    await expect(ExpoDevice.getDeviceTypeAsync()).resolves.toBe(3);
    await expect(ExpoDevice.getUptimeAsync()).resolves.toBeNull();
    await expect(ExpoDevice.isRootedExperimentalAsync()).resolves.toBe(false);
  });
});

describe('OS version (windows)', () => {
  it('is the platform constant as text, or nothing without one', async () => {
    const {Platform} = await import('react-native');
    const {ExponentConstants} = await import('./constants');
    vi.spyOn(Platform, 'constants', 'get').mockReturnValue({osVersion: 10.0} as never);
    expect(ExpoDevice.osVersion).toBe('10');
    expect(ExponentConstants.systemVersion).toBe('10');
    vi.spyOn(Platform, 'constants', 'get').mockReturnValue({} as never);
    expect(ExpoDevice.osVersion).toBe('');
    expect(ExponentConstants.systemVersion).toBeUndefined();
  });
});

import {appScheme, ExponentConstants, readAppConfig} from './constants';

const CONFIG = {name: 'Drop Files', slug: 'dropfiles', scheme: 'dropfiles', sdkVersion: '57.0.0'};

describe('ExponentConstants (windows)', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
  });

  it('is a bare app with a session and the embedded config as its manifest', () => {
    process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = JSON.stringify(CONFIG);
    expect(ExponentConstants.appOwnership).toBeNull();
    expect(ExponentConstants.executionEnvironment).toBe('bare');
    expect(ExponentConstants.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(ExponentConstants.isHeadless).toBe(false);
    expect(ExponentConstants.manifest).toEqual(CONFIG);
    expect(ExponentConstants.manifest2).toBeNull();
    expect(ExponentConstants.expoVersion).toBe('57.0.0');
    expect(ExponentConstants.expoRuntimeVersion).toBeNull();
    expect(ExponentConstants.linkingUri).toBe('dropfiles://');
    expect(ExponentConstants.experienceUrl).toBe('dropfiles://');
    expect(ExponentConstants.statusBarHeight).toBe(0);
    expect(ExponentConstants.systemFonts).toEqual([]);
    expect(ExponentConstants.deviceYearClass).toBeNull();
    expect(ExponentConstants.deviceName).toBeUndefined();
    expect(ExponentConstants.debugMode).toBe(true);
  });

  it('has no manifest, scheme or SDK version without an embedded config', async () => {
    expect(readAppConfig()).toBeNull();
    expect(ExponentConstants.manifest).toBeNull();
    expect(ExponentConstants.expoVersion).toBeNull();
    expect(ExponentConstants.linkingUri).toBe('');
    await expect(ExponentConstants.getWebViewUserAgentAsync()).resolves.toBeNull();
  });

  it('ignores a config that is not JSON or not an object', () => {
    process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = '{not json';
    expect(readAppConfig()).toBeNull();
    process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = '"a string"';
    expect(readAppConfig()).toBeNull();
  });

  it('reports the Windows version react-native-windows knows, as text', () => {
    expect([undefined, 'string']).toContain(typeof ExponentConstants.systemVersion);
  });

  it('takes the first scheme of a list, and none when there is none', () => {
    expect(appScheme({scheme: ['one', 'two']})).toBe('one');
    expect(appScheme({scheme: 'one'})).toBe('one');
    expect(appScheme({scheme: []})).toBeNull();
    expect(appScheme({})).toBeNull();
    expect(appScheme(null)).toBeNull();
  });
});

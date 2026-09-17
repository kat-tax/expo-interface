import {Linking, TurboModuleRegistry} from 'react-native';

/**
 * Every SDK 57 package, imported with the runtime installed — the way an
 * app's bundle imports them on Windows. A package whose native module is
 * missing throws `Cannot find native module` at import, so this is the test
 * that no package kills an app before its first render. (The engine resolves
 * node_modules files in Metro's iOS order; on Windows the plain file stands
 * where an `.ios` one is picked here, which for these packages is the same
 * `requireNativeModule` call.)
 */
const PACKAGES = [
  '@expo/dom-webview',
  'expo-age-range',
  'expo-app-metrics',
  'expo-apple-authentication',
  'expo-application',
  'expo-asset',
  'expo-audio',
  'expo-auth-session',
  'expo-background-fetch',
  'expo-background-task',
  'expo-battery',
  'expo-blob',
  'expo-blur',
  'expo-brightness',
  'expo-brownfield',
  'expo-calendar',
  'expo-camera',
  'expo-cellular',
  'expo-checkbox',
  'expo-clipboard',
  'expo-constants',
  'expo-contacts',
  'expo-crypto',
  'expo-device',
  'expo-document-picker',
  'expo-eas-client',
  'expo-file-system',
  'expo-font',
  'expo-gl',
  'expo-haptics',
  'expo-image-manipulator',
  'expo-image-picker',
  'expo-insights',
  'expo-intent-launcher',
  'expo-keep-awake',
  'expo-linear-gradient',
  'expo-linking',
  'expo-live-photo',
  'expo-local-authentication',
  'expo-localization',
  'expo-location',
  'expo-mail-composer',
  'expo-manifests',
  'expo-maps',
  'expo-media-library',
  'expo-mesh-gradient',
  'expo-navigation-bar',
  'expo-network',
  'expo-notifications',
  'expo-observe',
  'expo-print',
  'expo-screen-capture',
  'expo-screen-orientation',
  'expo-secure-store',
  'expo-sensors',
  'expo-sharing',
  'expo-sms',
  'expo-speech',
  'expo-splash-screen',
  'expo-sqlite',
  'expo-status-bar',
  'expo-store-review',
  'expo-system-ui',
  'expo-task-manager',
  'expo-tracking-transparency',
  'expo-updates',
  'expo-video',
  'expo-video-thumbnails',
  'expo-web-browser',
  // Not here: `expo-widgets`, whose module file is iOS-only beside a plain stub — Windows takes the stub, the engine the iOS file.
];

describe('the SDK 57 packages on Windows', () => {
  let previous: typeof globalThis.expo;

  beforeAll(async () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    previous = globalThis.expo;
    globalThis.expo = undefined as unknown as typeof globalThis.expo;
    await import('./install.windows');
  });

  afterAll(() => {
    globalThis.expo = previous;
  });

  it.each(PACKAGES)('%s imports with the runtime installed', async name => {
    await expect(import(/* @vite-ignore */ name)).resolves.toBeTypeOf('object');
  });

  it('answers feature detection honestly', async () => {
    const Crypto = await import('expo-crypto');
    expect(() => Crypto.getRandomValues(new Uint8Array(4))).toThrow(/Crypto\.getRandomValues/);
    const StoreReview = await import('expo-store-review');
    await expect(StoreReview.isAvailableAsync()).resolves.toBe(false);
    const Sharing = await import('expo-sharing');
    await expect(Sharing.isAvailableAsync()).resolves.toBe(false);
    const SMS = await import('expo-sms');
    await expect(SMS.isAvailableAsync()).resolves.toBe(false);
    const Updates = await import('expo-updates');
    expect(Updates.isEnabled).toBe(false);
    const Application = await import('expo-application');
    expect(Application.applicationId).toBeNull();
    const Battery = await import('expo-battery');
    await expect(Battery.isAvailableAsync()).resolves.toBe(false);
    const Contacts = await import('expo-contacts');
    await expect(Contacts.getPermissionsAsync()).resolves.toMatchObject({granted: false, canAskAgain: false});
    const {Blob} = await import('expo-blob');
    await expect(new Blob(['ab', 'c']).text()).resolves.toBe('abc');
    const Sensors = await import('expo-sensors');
    await expect(Sensors.Accelerometer.isAvailableAsync()).resolves.toBe(false);
    const Haptics = await import('expo-haptics');
    await expect(Haptics.selectionAsync()).resolves.toBeUndefined();
  });
});

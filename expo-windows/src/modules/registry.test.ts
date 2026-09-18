import {Linking, TurboModuleRegistry} from 'react-native';
import {installUuidFallback, uuidv4} from '../uuid';
import {registerModules} from './index';
import {registeredModules, registerModule} from './registry';
import {UNAVAILABLE} from './unavailable';

/** The modules with a Windows implementation, by the name their package asks for. */
const REAL_MODULES = [
  'CalendarNext',
  'EASClient',
  'ExpoAgeRange',
  'ExpoAppMetrics',
  'ExpoApplication',
  'ExpoAsset',
  'ExpoAudio',
  'ExpoBackgroundFetch',
  'ExpoBackgroundTask',
  'ExpoBlob',
  'ExpoBrightness',
  'ExpoCalendar',
  'ExpoCellular',
  'ExpoClipboard',
  'ExpoContacts',
  'ExpoContactsNext',
  'ExpoCrypto',
  'ExpoCryptoAES',
  'ExpoDevice',
  'ExpoDocumentPicker',
  'ExpoFontLoader',
  'ExpoHaptics',
  'ExpoImage',
  'ExpoImageManipulator',
  'ExpoKeepAwake',
  'ExpoLinking',
  'ExpoLocalization',
  'ExpoMailComposer',
  'ExpoMediaLibrary',
  'ExpoMediaLibraryNext',
  'ExpoNetwork',
  'ExpoObserve',
  'ExpoSMS',
  'ExpoScreenOrientation',
  'ExpoSecureStore',
  'ExpoSharing',
  'ExpoSpeech',
  'ExpoStoreReview',
  'ExpoSystemUI',
  'ExpoTaskManager',
  'ExpoTrackingTransparency',
  'ExpoUpdates',
  'ExpoVideo',
  'ExpoVideoThumbnails',
  'ExpoBattery',
  'ExpoScreenCapture',
  'ExpoLocalAuthentication',
  'ExpoLocation',
  'ExponentAccelerometer',
  'ExponentGyroscope',
  'ExponentMagnetometer',
  'ExponentMagnetometerUncalibrated',
  'ExpoBarometer',
  'ExpoLightSensor',
  'ExponentDeviceMotion',
  'ExponentPedometer',
  'ExpoNotificationScheduler',
  'ExpoNotificationPresenter',
  'ExpoNotificationPermissionsModule',
  'ExpoNotificationsEmitter',
  'ExpoNotificationsHandlerModule',
  'ExpoBadgeModule',
  'ExpoNotificationChannelManager',
  'ExpoNotificationChannelGroupManager',
  'ExpoNotificationCategoriesModule',
  'ExpoSQLite',
  'ExpoCamera',
  'ExpoMaps',
  'ExpoPrint',
  'ExpoWebBrowser',
  'ExpoWindows',
  'ExponentConstants',
  'ExponentFileSystem',
  'ExponentImagePicker',
  'FileSystem',
];

/** Runs `body` with a fresh `expo` global — the polyfill's shape — and puts the harness's back. */
function withFreshGlobal(body: (expo: {modules: Record<string, object>}) => void) {
  const previous = globalThis.expo;
  const expo = {...previous, modules: {}} as typeof globalThis.expo;
  globalThis.expo = expo;
  try {
    body(expo as unknown as {modules: Record<string, object>});
  } finally {
    globalThis.expo = previous;
  }
}

describe('registry (windows)', () => {
  it('registers a module under the name its package asks for, once', () => {
    withFreshGlobal(expo => {
      const first = {a: 1};
      registerModule('ExpoThing', first);
      registerModule('ExpoThing', {a: 2});
      expect(expo.modules.ExpoThing).toBe(first);
      expect(registeredModules()).toEqual(['ExpoThing']);
      expect(first).not.toHaveProperty('__expo_module_name__');
    });
  });

  it('marks one of the core\'s own modules with its name, for the core\'s legacy emitter to listen to it directly', () => {
    withFreshGlobal(expo => {
      const NativeModule = globalThis.expo.NativeModule as new () => object;
      const module = new NativeModule();
      registerModule('ExpoEmitting', module);
      expect(expo.modules.ExpoEmitting).toBe(module);
      expect((module as {__expo_module_name__?: string}).__expo_module_name__).toBe('ExpoEmitting');
      expect(Object.keys(module)).not.toContain('__expo_module_name__');
    });
  });

  it('creates the registry when the global has none, and refuses without the global', () => {
    const previous = globalThis.expo;
    try {
      globalThis.expo = {...previous, modules: undefined} as unknown as typeof globalThis.expo;
      registerModule('ExpoThing', {});
      expect(registeredModules()).toEqual(['ExpoThing']);
      globalThis.expo = undefined as unknown as typeof globalThis.expo;
      expect(registeredModules()).toEqual([]);
      expect(() => registerModule('ExpoThing', {})).toThrow(/install runs first/);
    } finally {
      globalThis.expo = previous;
    }
  });

  it('registers every Windows module an Expo package asks for, the real ones and the unavailable table', () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    withFreshGlobal(expo => {
      registerModules();
      expect(Object.keys(expo.modules).sort()).toEqual([...REAL_MODULES, ...Object.keys(UNAVAILABLE)].sort());
      expect(typeof (expo.modules.ExpoLinking as {getLinkingURL(): unknown}).getLinkingURL).toBe('function');
      // A real module is never shadowed by the table: none of the real names is in it.
      for (const name of REAL_MODULES) expect(UNAVAILABLE).not.toHaveProperty(name);
    });
  });
});

describe('uuid (windows)', () => {
  it('makes a v4 id from Math.random when crypto has none, and from crypto when it does', () => {
    const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    try {
      Object.defineProperty(globalThis, 'crypto', {value: undefined, configurable: true});
      expect(uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'from-crypto'}, configurable: true});
      expect(uuidv4()).toBe('from-crypto');
    } finally {
      if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
      else delete (globalThis as {crypto?: unknown}).crypto;
    }
  });

  it('points the global at the fallback, when there is a global', () => {
    withFreshGlobal(() => {
      installUuidFallback();
      expect(globalThis.expo.uuidv4).toBe(uuidv4);
    });
    const previous = globalThis.expo;
    try {
      globalThis.expo = undefined as unknown as typeof globalThis.expo;
      expect(() => installUuidFallback()).not.toThrow();
    } finally {
      globalThis.expo = previous;
    }
  });
});

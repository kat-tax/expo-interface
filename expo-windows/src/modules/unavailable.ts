import {uuidv4} from '../uuid';
import {nativeModuleClass, UnavailabilityError} from './base';
import {DENIED} from './permissions';
import {registerModule} from './registry';

/**
 * What a module the platform does not have looks like to its package: every
 * member the package's JavaScript reads is there, so importing the package
 * never throws — `requireNativeModule` throws at import for a name it cannot
 * find, and the app never renders — and each member answers honestly when
 * used. A method throws the package's own unavailability error; a class the
 * package subclasses or instantiates throws when constructed; a constant
 * holds what a platform without the feature holds; and where a question has
 * an answer without the feature — is there a camera, may the app read
 * contacts — it is answered rather than thrown.
 */
export type UnavailableSpec = {
  /** The name the package gives itself in its own errors: `Crypto`, `SecureStore`. */
  package: string;
  /** Members that throw the unavailability error when called. */
  methods?: readonly string[];
  /** Members the package subclasses or instantiates; constructing one throws. */
  classes?: readonly string[];
  /** Members read as values, with what a platform without the feature holds. */
  constants?: Record<string, unknown>;
  /** Members with an honest answer even without the feature. */
  answers?: Record<string, unknown>;
};

export function unavailableMethod(packageName: string, name: string): () => never {
  return function unavailable(): never {
    throw new UnavailabilityError(packageName, name);
  };
}

export function unavailableClass(packageName: string, name: string): new () => object {
  const Unavailable = class {
    constructor() {
      throw new UnavailabilityError(packageName, name);
    }
  };
  Object.defineProperty(Unavailable, 'name', {value: name});
  return Unavailable;
}

/**
 * A `NativeModule` — listeners included — with the spec's members. It also
 * takes React Native's legacy `removeListeners(count)`, which the packages
 * that wrap a module in `LegacyEventEmitter` (`expo-notifications`) expect
 * beside `addListener`, or React Native warns at every wrap.
 */
export function unavailableModule(spec: UnavailableSpec): object {
  const Module = nativeModuleClass();
  const module = new Module() as unknown as Record<string, unknown>;
  module.removeListeners = nothing;
  for (const name of spec.methods ?? []) module[name] = unavailableMethod(spec.package, name);
  for (const name of spec.classes ?? []) module[name] = unavailableClass(spec.package, name);
  Object.assign(module, spec.constants, spec.answers);
  return module;
}

const no = async (): Promise<false> => false;
const denied = async () => DENIED;
const nothing = (): void => {};

function sensor(packageName: string, extra: Partial<UnavailableSpec> = {}): UnavailableSpec {
  return {
    package: packageName,
    ...extra,
    answers: {isAvailableAsync: no, setUpdateInterval: nothing, ...extra.answers},
  };
}

const NOTIFICATIONS = 'Notifications';

/**
 * Every native module an SDK 57 package asks for that the runtime has no
 * implementation of yet, keyed by the name the package asks
 * `requireNativeModule` for. The member lists are the members the packages'
 * own JavaScript reads (an audit of their sources); an entry leaves the
 * table when its module becomes real.
 */
export const UNAVAILABLE: Record<string, UnavailableSpec> = {
  ExpoAudio: {
    package: 'Audio',
    methods: ['clearAllPreloadedSources', 'clearPreloadedSource', 'getPreloadedSources', 'preload', 'setAudioModeAsync', 'setIsAudioActiveAsync'],
    classes: ['AudioPlayer', 'AudioPlaylist', 'AudioRecorder', 'AudioStream'],
    answers: {getRecordingPermissionsAsync: denied, requestRecordingPermissionsAsync: denied, requestNotificationPermissionsAsync: denied},
  },
  ExpoBattery: {
    package: 'Battery',
    methods: ['getBatteryLevelAsync', 'getBatteryStateAsync', 'isBatteryOptimizationEnabledAsync', 'isLowPowerModeEnabledAsync'],
    constants: {isSupported: false},
  },
  ExpoBrownfieldModule: {package: 'Brownfield', methods: ['popToNative', 'sendMessage', 'setNativeBackEnabled']},
  ExpoBrownfieldStateModule: {package: 'Brownfield', methods: ['deleteSharedState', 'getSharedState']},
  ExpoCamera: {
    package: 'Camera',
    methods: ['dismissScanner', 'getAvailableVideoCodecsAsync', 'launchScanner', 'scanFromURLAsync'],
    classes: ['Picture'],
    constants: {isModernBarcodeScannerAvailable: false, toggleRecordingAsyncAvailable: false},
    answers: {
      isAvailableAsync: no,
      getCameraPermissionsAsync: denied,
      getMicrophonePermissionsAsync: denied,
      requestCameraPermissionsAsync: denied,
      requestMicrophonePermissionsAsync: denied,
    },
  },
  ExpoDocumentPicker: {package: 'DocumentPicker', methods: ['getDocumentAsync']},
  ExpoDomWebViewModule: {package: 'DomWebView', methods: ['evalJsForWebViewAsync']},
  FileSystem: {
    package: 'FileSystem',
    methods: ['cancelDownloadAsync', 'downloadFileAsync', 'info', 'pickDirectoryAsync', 'pickFileAsync'],
    classes: ['FileSystemDirectory', 'FileSystemDownloadTask', 'FileSystemFile', 'FileSystemUploadTask', 'FileSystemWatcher'],
    constants: {appleSharedContainers: {}, availableDiskSpace: 0, bundleDirectory: null, cacheDirectory: null, documentDirectory: null, totalDiskSpace: 0},
  },
  ExpoGL: {package: 'GLView', methods: ['createCameraTextureAsync', 'createContextAsync', 'destroyContextAsync', 'destroyObjectAsync', 'takeSnapshotAsync']},
  ExpoImageManipulator: {package: 'ImageManipulator', methods: ['manipulate'], classes: ['Context']},
  ExponentImagePicker: {
    package: 'ImagePicker',
    methods: ['getPendingResultAsync', 'launchCameraAsync', 'launchImageLibraryAsync'],
    answers: {
      getCameraPermissionsAsync: denied,
      getMediaLibraryPermissionsAsync: denied,
      requestCameraPermissionsAsync: denied,
      requestMediaLibraryPermissionsAsync: denied,
    },
  },
  ExpoLocalAuthentication: {
    package: 'LocalAuthentication',
    methods: ['authenticateAsync', 'cancelAuthenticate'],
    answers: {hasHardwareAsync: no, isEnrolledAsync: no, supportedAuthenticationTypesAsync: async () => [], getEnrolledLevelAsync: async () => 0},
  },
  ExpoLocation: {
    package: 'Location',
    methods: [
      'enableNetworkProviderAsync',
      'geocodeAsync',
      'getCurrentPositionAsync',
      'getLastKnownPositionAsync',
      'getProviderStatusAsync',
      'hasStartedGeofencingAsync',
      'hasStartedLocationUpdatesAsync',
      'removeWatchAsync',
      'reverseGeocodeAsync',
      'startGeofencingAsync',
      'startLocationUpdatesAsync',
      'stopGeofencingAsync',
      'stopLocationUpdatesAsync',
      'watchDeviceHeading',
      'watchMotionActivityImplAsync',
      'watchPositionImplAsync',
    ],
    answers: {
      hasServicesEnabledAsync: no,
      getForegroundPermissionsAsync: denied,
      getBackgroundPermissionsAsync: denied,
      getMotionActivityPermissionsAsync: denied,
      requestForegroundPermissionsAsync: denied,
      requestBackgroundPermissionsAsync: denied,
      requestMotionActivityPermissionsAsync: denied,
      requestPermissionsAsync: denied,
    },
  },
  ExpoMaps: {package: 'Maps', answers: {getPermissionsAsync: denied, requestPermissionsAsync: denied}},
  ExpoMediaLibrary: {
    package: 'MediaLibrary',
    methods: [
      'addAssetsToAlbumAsync',
      'albumNeedsMigrationAsync',
      'createAlbumAsync',
      'createAssetAsync',
      'deleteAlbumsAsync',
      'deleteAssetsAsync',
      'getAlbumAsync',
      'getAlbumsAsync',
      'getAssetContentUriAsync',
      'getAssetInfoAsync',
      'getAssetsAsync',
      'getMomentsAsync',
      'migrateAlbumIfNeededAsync',
      'presentPermissionsPickerAsync',
      'removeAssetsFromAlbumAsync',
      'saveToLibraryAsync',
      'setAssetFavoriteAsync',
    ],
    constants: {
      CHANGE_LISTENER_NAME: 'mediaLibraryDidChange',
      MediaType: {audio: 'audio', photo: 'photo', video: 'video', unknown: 'unknown'},
      SortBy: {default: 'default', mediaType: 'mediaType', width: 'width', height: 'height', creationTime: 'creationTime', modificationTime: 'modificationTime', duration: 'duration'},
    },
    answers: {getPermissionsAsync: denied, requestPermissionsAsync: denied},
  },
  ExpoMediaLibraryNext: {
    package: 'MediaLibrary',
    methods: ['presentPermissionsPicker'],
    classes: ['Album', 'Asset', 'Query'],
    answers: {getPermissionsAsync: denied, requestPermissionsAsync: denied},
  },
  ExpoBackgroundNotificationTasksModule: {package: NOTIFICATIONS, methods: ['registerTaskAsync', 'unregisterTaskAsync']},
  ExpoBadgeModule: {package: NOTIFICATIONS, methods: ['setBadgeCountAsync']},
  ExpoNotificationCategoriesModule: {package: NOTIFICATIONS, methods: ['deleteNotificationCategoryAsync', 'getNotificationCategoriesAsync', 'setNotificationCategoryAsync']},
  ExpoNotificationChannelGroupManager: {
    package: NOTIFICATIONS,
    methods: ['deleteNotificationChannelGroupAsync', 'getNotificationChannelGroupAsync', 'getNotificationChannelGroupsAsync', 'setNotificationChannelGroupAsync'],
  },
  ExpoNotificationChannelManager: {
    package: NOTIFICATIONS,
    methods: ['deleteNotificationChannelAsync', 'getNotificationChannelAsync', 'getNotificationChannelsAsync', 'setNotificationChannelAsync'],
  },
  ExpoNotificationPermissionsModule: {package: NOTIFICATIONS, answers: {getPermissionsAsync: denied, requestPermissionsAsync: denied}},
  ExpoNotificationPresenter: {package: NOTIFICATIONS, methods: ['dismissAllNotificationsAsync', 'dismissNotificationAsync', 'getPresentedNotificationsAsync']},
  ExpoNotificationScheduler: {
    package: NOTIFICATIONS,
    methods: ['cancelAllScheduledNotificationsAsync', 'cancelScheduledNotificationAsync', 'getAllScheduledNotificationsAsync', 'getNextTriggerDateAsync', 'scheduleNotificationAsync'],
  },
  ExpoNotificationsEmitter: {package: NOTIFICATIONS, methods: ['clearLastNotificationResponse'], answers: {getLastNotificationResponse: () => null}},
  ExpoNotificationsHandlerModule: {package: NOTIFICATIONS, methods: ['handleNotificationAsync']},
  ExpoPushTokenManager: {package: NOTIFICATIONS, methods: ['getDevicePushTokenAsync', 'unregisterForNotificationsAsync']},
  // Read at import by the package's automatic registration: no registration is kept, and none is made.
  NotificationsServerRegistrationModule: {
    package: NOTIFICATIONS,
    answers: {getInstallationIdAsync: async () => uuidv4(), getRegistrationInfoAsync: async () => null, setRegistrationInfoAsync: async () => {}},
  },
  ExpoPrint: {package: 'Print', methods: ['print', 'printToFileAsync', 'selectPrinter'], constants: {Orientation: {portrait: 'portrait', landscape: 'landscape'}}},
  ExpoScreenCapture: {
    package: 'ScreenCapture',
    methods: ['allowScreenCapture', 'disableAppSwitcherProtection', 'enableAppSwitcherProtection', 'preventScreenCapture'],
    answers: {getPermissionsAsync: denied, requestPermissionsAsync: denied},
  },
  ExponentAccelerometer: sensor('Accelerometer'),
  ExponentGyroscope: sensor('Gyroscope'),
  ExponentMagnetometer: sensor('Magnetometer'),
  ExponentMagnetometerUncalibrated: sensor('MagnetometerUncalibrated'),
  ExponentDeviceMotion: sensor('DeviceMotion', {constants: {Gravity: 9.80665}}),
  ExpoBarometer: sensor('Barometer'),
  ExpoLightSensor: sensor('LightSensor'),
  ExponentPedometer: sensor('Pedometer', {methods: ['getStepCountAsync'], answers: {getPermissionsAsync: denied, requestPermissionsAsync: denied}}),
  ExpoSpeech: {package: 'Speech', methods: ['getVoices', 'isSpeaking', 'pause', 'resume', 'speak', 'stop']},
  ExpoSQLite: {
    package: 'SQLite',
    methods: ['backupDatabaseSync', 'deleteDatabaseAsync', 'deleteDatabaseSync', 'ensureDatabasePathExistsAsync', 'ensureDatabasePathExistsSync', 'importAssetDatabaseAsync'],
    classes: ['NativeDatabase', 'NativeSession', 'NativeStatement'],
    constants: {bundledExtensions: [], defaultDatabaseDirectory: ''},
  },
  ExpoVideoThumbnails: {package: 'VideoThumbnails', methods: ['getThumbnail']},
  ExpoVideo: {
    package: 'Video',
    methods: ['clearVideoCacheAsync', 'getCurrentVideoCacheSize', 'setVideoCacheSizeAsync'],
    classes: ['VideoPlayer', 'VideoThumbnail'],
    constants: {isPictureInPictureSupported: false},
  },
};

/**
 * Registers the table, after the real modules: the registry keeps the first
 * module under a name, so a real one is never shadowed.
 */
export function registerUnavailableModules(): void {
  for (const [name, spec] of Object.entries(UNAVAILABLE)) registerModule(name, unavailableModule(spec));
}

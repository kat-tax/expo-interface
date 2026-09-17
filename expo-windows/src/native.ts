import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * The runtime's own TurboModules, from its Windows library
 * (`windows/ExpoWindows`, autolinked into the app), each asked for at the
 * time it is used and `null` while the library is not in the app — the
 * JavaScript modules then fall back to what the platform gives them
 * without it.
 */

export interface TitleBarInsets {
  left: number;
  right: number;
  height: number;
}

export interface NativeWindow extends TurboModule {
  setTitle(title: string): void;
  getTitle(): Promise<string>;
  /** Extends the content into the title bar, or takes it back; false where the title bar cannot be customized. */
  setChrome(extend: boolean, theme: string): Promise<boolean>;
  getTitleBarInsets(): Promise<TitleBarInsets>;
  setDragRegion(x: number, y: number, width: number, height: number): void;
  /** The window's own background, or the system's for an empty color. */
  setBackground(color: string): void;
}

export interface DeviceConstants {
  deviceName?: string;
  manufacturer?: string;
  brand?: string;
  modelName?: string;
  productName?: string;
  modelId?: string;
  designName?: string;
  osVersion?: string;
  osBuildId?: string;
  totalMemory?: number;
  supportedCpuArchitectures?: string[];
}

export interface NativeDevice extends TurboModule {
  getConstants(): DeviceConstants;
  getUptime(): Promise<number>;
}

export interface ClipboardImage {
  data: string;
  size: {width: number; height: number};
}

export interface NativeClipboard extends TurboModule {
  getString(preferredFormat: string): Promise<string>;
  setString(text: string, inputFormat: string): Promise<boolean>;
  hasString(): Promise<boolean>;
  getUrl(): Promise<string>;
  setUrl(url: string): Promise<void>;
  hasUrl(): Promise<boolean>;
  getImage(): Promise<ClipboardImage | null>;
  setImage(base64: string): Promise<void>;
  hasImage(): Promise<boolean>;
}

export interface NativeSharing extends TurboModule {
  isAvailable(): Promise<boolean>;
  share(path: string, title: string): Promise<void>;
}

export interface NativeLinking extends TurboModule {
  getInitialUrl(): Promise<string>;
  registerProtocol(scheme: string, displayName: string): Promise<void>;
}

export interface NativeFonts extends TurboModule {
  load(family: string, uri: string): Promise<void>;
  unload(family: string): Promise<void>;
}

/** The system's colours for the parts of a window, as CSS hex: the high contrast theme's while one is on. */
export interface SystemColors {
  background: string;
  text: string;
  highlight: string;
  highlightText: string;
  buttonFace: string;
  buttonText: string;
  link: string;
  disabledText: string;
}

export interface HighContrastState {
  enabled: boolean;
  /** The theme's name ("High Contrast Black"), empty while none is on. */
  scheme: string;
  colors: SystemColors;
}

export interface NativeAccessibility extends TurboModule {
  getHighContrast(): Promise<HighContrastState>;
}

export interface NativeKeyboard extends TurboModule {
  /** Shows the touch keyboard for the window; false where it could not be. */
  show(): Promise<boolean>;
  hide(): Promise<boolean>;
  getState(): Promise<{visible: boolean; height: number}>;
}

/** What a synchronous call of the library answers: the value, or the error it hit (a synchronous method cannot reject). */
export type SyncResult<T> = {value?: T; error?: string};

/** The value of a synchronous answer, or the library's error as an exception. */
export function unwrap<T>(result: SyncResult<T>): T {
  if (result.error !== undefined) throw new Error(result.error);
  return result.value as T;
}

export interface NativeCrypto extends TurboModule {
  /** The digest of the base64 data with the algorithm (`SHA-256`, `MD5`, ...), as base64. */
  digest(algorithm: string, dataBase64: string): SyncResult<string>;
  /** `count` random bytes from the system's generator, as base64. */
  randomBytes(count: number): SyncResult<string>;
  /** AES-GCM: the ciphertext and the 16-byte tag, both base64; `aad` may be empty. */
  aesGcmEncrypt(keyBase64: string, ivBase64: string, plaintextBase64: string, aadBase64: string): Promise<{ciphertext: string; tag: string}>;
  aesGcmDecrypt(keyBase64: string, ivBase64: string, ciphertextBase64: string, tagBase64: string, aadBase64: string): Promise<string>;
}

export interface NativeSecureStore extends TurboModule {
  getValue(key: string, service: string): SyncResult<string | null>;
  setValue(value: string, key: string, service: string): SyncResult<null>;
  deleteValue(key: string, service: string): SyncResult<null>;
  /** Asks the user to verify themselves (Windows Hello); false when they did not. */
  verify(prompt: string): Promise<boolean>;
  /** Whether Windows Hello is set up for the user, as known at the instance's start. */
  canVerify(): boolean;
}

export interface NativeLocale {
  languageTag: string;
  languageCode: string | null;
  languageScriptCode: string | null;
  regionCode: string | null;
  languageRegionCode: string | null;
  currencyCode: string | null;
  currencySymbol: string | null;
  languageCurrencyCode: string | null;
  languageCurrencySymbol: string | null;
  decimalSeparator: string | null;
  digitGroupingSeparator: string | null;
  textDirection: 'ltr' | 'rtl';
  measurementSystem: 'metric' | 'us' | 'uk' | null;
  temperatureUnit: 'celsius' | 'fahrenheit' | null;
}

export interface NativeCalendar {
  calendar: string | null;
  timeZone: string | null;
  uses24hourClock: boolean | null;
  firstWeekday: number | null;
}

export interface NativeLocalization extends TurboModule {
  getLocales(): NativeLocale[];
  getCalendars(): NativeCalendar[];
}

export interface NetworkState {
  type: 'NONE' | 'UNKNOWN' | 'CELLULAR' | 'WIFI' | 'ETHERNET' | 'VPN' | 'OTHER';
  isConnected: boolean;
  isInternetReachable: boolean;
}

export interface NativeNetwork extends TurboModule {
  getState(): Promise<NetworkState>;
  getIpAddress(): Promise<string>;
}

/** What the file module knows about a path. */
export interface EntryInfo {
  exists: boolean;
  isDirectory: boolean;
  uri: string;
  size: number;
  /** Milliseconds since the epoch; 0 for an entry that is not there. */
  modificationTime: number;
  creationTime: number;
  /** The MIME type the system registers for the extension, or empty. */
  type: string;
}

export interface FileSystemConstants {
  cacheDirectory?: string;
  documentDirectory?: string;
  bundleDirectory?: string;
  totalDiskSpace?: number;
  availableDiskSpace?: number;
}

export interface NativeFileSystem extends TurboModule {
  getConstants(): FileSystemConstants;
  info(uri: string): SyncResult<EntryInfo>;
  readText(uri: string): SyncResult<string>;
  readBase64(uri: string): SyncResult<string>;
  write(uri: string, content: string, base64: boolean, append: boolean): SyncResult<null>;
  md5(uri: string): SyncResult<string>;
  createFile(uri: string, overwrite: boolean, intermediates: boolean): SyncResult<null>;
  createDirectory(uri: string, overwrite: boolean, intermediates: boolean, idempotent: boolean): SyncResult<null>;
  remove(uri: string, idempotent: boolean): SyncResult<null>;
  /** Copies or moves into `to` when it is a directory, else to it; answers with where the entry landed. */
  copy(from: string, to: string, overwrite: boolean): SyncResult<string>;
  move(from: string, to: string, overwrite: boolean): SyncResult<string>;
  list(uri: string): SyncResult<{uri: string; isDirectory: boolean}[]>;
  open(uri: string, mode: string): SyncResult<number>;
  readBytes(handle: number, length: number): SyncResult<string>;
  writeBytes(handle: number, base64: string): SyncResult<null>;
  handleInfo(handle: number): SyncResult<{offset: number; size: number}>;
  seek(handle: number, offset: number): SyncResult<null>;
  close(handle: number): SyncResult<null>;
  /** Downloads to the file, or into the directory; progress comes as `onFileSystemProgress` events with the task id. */
  download(url: string, toUri: string, headers: Record<string, string>, taskId: string): Promise<string>;
  upload(url: string, fileUri: string, options: Record<string, unknown>, taskId: string): Promise<{status: number; headers: Record<string, string>; body: string}>;
  cancel(taskId: string): void;
  pickFile(initialUri: string, mimeTypes: string[], multiple: boolean): Promise<{uri: string} | {uri: string}[]>;
  pickDirectory(initialUri: string): Promise<{uri: string}>;
  /** Watches a file or a directory (recursively); changes come as `onFileSystemChange` events with the id. */
  watch(id: number, uri: string): SyncResult<null>;
  unwatch(id: number): SyncResult<null>;
}

export interface ImageAction {
  resize?: {width?: number | null; height?: number | null};
  crop?: {originX: number; originY: number; width: number; height: number};
  rotate?: number;
  flip?: 'vertical' | 'horizontal';
  extent?: object;
}

export interface NativeImages extends TurboModule {
  /** The image's size, the way it is meant to be seen (EXIF orientation applied). */
  info(uri: string): Promise<{width: number; height: number}>;
  /** The image through the actions, encoded (`jpeg` or `png`; `compress` is the JPEG quality) into the cache. */
  manipulate(uri: string, actions: ImageAction[], format: string, compress: number, base64: boolean): Promise<{uri: string; width: number; height: number; base64?: string}>;
  /** The camera capture UI; null when the user takes nothing. */
  capture(video: boolean): Promise<{uri: string} | null>;
}

export type MediaKind = 'photo' | 'video' | 'audio' | 'unknown';

export interface MediaAsset {
  /** The file's path — what the package passes back as the asset. */
  id: string;
  filename: string;
  uri: string;
  mediaType: MediaKind;
  width: number;
  height: number;
  /** Milliseconds since the epoch; a photo's date taken when it has one. */
  creationTime: number;
  modificationTime: number;
  /** Seconds; 0 for a photo. */
  duration: number;
  /** The folder under the library the file is in, or null at the library's top. */
  albumId: string | null;
}

export interface MediaAssetInfo extends MediaAsset {
  localUri: string;
  exif: Record<string, unknown>;
  location?: {latitude: number; longitude: number};
  orientation?: number;
  isFavorite: boolean;
}

export interface MediaAlbum {
  /** The folder's path. */
  id: string;
  title: string;
  assetCount: number;
  type: 'album';
  startTime: number;
  endTime: number;
}

export interface NativeMediaLibrary extends TurboModule {
  /** The assets of an album by id, or of the whole library for ''. */
  assets(album: string): Promise<MediaAsset[]>;
  assetInfo(id: string): Promise<MediaAssetInfo>;
  albums(): Promise<MediaAlbum[]>;
  /** A file copied into an album, or into the library for its kind for ''. */
  createAsset(localUri: string, album: string): Promise<MediaAsset>;
  /** A folder under the library, with the asset (when one is named) copied or moved in. */
  createAlbum(name: string, assetId: string, move: boolean): Promise<MediaAlbum>;
  deleteAssets(ids: string[]): Promise<boolean>;
  deleteAlbums(ids: string[], deleteAssets: boolean): Promise<boolean>;
  addAssetsToAlbum(ids: string[], album: string, copy: boolean): Promise<boolean>;
  removeAssetsFromAlbum(ids: string[], album: string): Promise<boolean>;
  /** The shell's change notifications, as `onMediaLibraryChange`, on or off. */
  watch(on: boolean): void;
}

function get<T extends TurboModule>(name: string): T | null {
  return TurboModuleRegistry.get<T>(name);
}

export const native = {
  window: () => get<NativeWindow>('ExpoWindowsWindow'),
  device: () => get<NativeDevice>('ExpoWindowsDevice'),
  clipboard: () => get<NativeClipboard>('ExpoWindowsClipboard'),
  sharing: () => get<NativeSharing>('ExpoWindowsSharing'),
  linking: () => get<NativeLinking>('ExpoWindowsLinking'),
  fonts: () => get<NativeFonts>('ExpoWindowsFonts'),
  accessibility: () => get<NativeAccessibility>('ExpoWindowsAccessibility'),
  keyboard: () => get<NativeKeyboard>('ExpoWindowsKeyboard'),
  crypto: () => get<NativeCrypto>('ExpoWindowsCrypto'),
  secureStore: () => get<NativeSecureStore>('ExpoWindowsSecureStore'),
  localization: () => get<NativeLocalization>('ExpoWindowsLocalization'),
  network: () => get<NativeNetwork>('ExpoWindowsNetwork'),
  fileSystem: () => get<NativeFileSystem>('ExpoWindowsFileSystem'),
  images: () => get<NativeImages>('ExpoWindowsImages'),
  mediaLibrary: () => get<NativeMediaLibrary>('ExpoWindowsMediaLibrary'),
};

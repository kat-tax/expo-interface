import type {EmitterSubscription} from 'react-native';
import type {NativeModule, SharedObject} from 'expo-modules-core';
import type {} from 'expo-modules-core/src/polyfill/dangerous-internal';
import type {EntryInfo, NativeFileSystem} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {base64Decode, base64Encode} from '../bytes';
import {native, unwrap} from '../native';
import {uuidv4} from '../uuid';
import {nativeModuleClass, UnavailabilityError} from './base';

const FILE_SYSTEM = 'FileSystem';

function library(method: string): NativeFileSystem {
  const fileSystem = native.fileSystem();
  if (!fileSystem) throw new UnavailabilityError(FILE_SYSTEM, method);
  return fileSystem;
}

/** A `file:` URI of a directory ends with a slash; a file's does not. */
export function directoryUri(uri: string): string {
  return uri.endsWith('/') ? uri : `${uri}/`;
}

export function fileUri(uri: string): string {
  return uri.replace(/\/+$/, '');
}

/** The name at the end of a URI, decoded. */
export function nameOf(uri: string): string {
  const parts = fileUri(uri).split('/');
  return decodeURIComponent(parts[parts.length - 1]);
}

/** The URI of `name` inside a directory, the characters a URI cannot carry percent-encoded. */
export function childUri(directory: string, name: string): string {
  return directoryUri(directory) + name.replace(/[^\w.\-~]/g, character => encodeURIComponent(character));
}

export function parentUri(uri: string): string {
  const parts = fileUri(uri).split('/');
  parts.pop();
  return `${parts.join('/')}/`;
}

type Entry = {readonly uri: string};
type RelocationOptions = {overwrite?: boolean};
type WriteOptions = {encoding?: 'utf8' | 'base64'; append?: boolean};
type FileInfo = {exists: boolean; uri?: string; size?: number; modificationTime?: number; creationTime?: number; md5?: string};
type DirectoryInfo = {exists: boolean; uri?: string; size?: number; modificationTime?: number; creationTime?: number; files?: string[]};
type WatchEvent = {id: number; type: 'created' | 'modified' | 'deleted' | 'renamed'; path: string; isDirectory: boolean; newPath?: string; newPathIsDirectory?: boolean};

export interface FileHandle {
  readBytes(length: number): Uint8Array;
  writeBytes(bytes: Uint8Array): void;
  close(): void;
  offset: number | null;
  readonly size: number | null;
}

type FileSystemEvents = {
  downloadProgress(event: {uuid: string; data: Record<string, number>}): void;
};

export interface ExpoFileSystemModule extends InstanceType<NativeModule<FileSystemEvents>> {
  FileSystemFile: new (uri: string) => object;
  FileSystemDirectory: new (uri: string) => object;
  FileSystemDownloadTask: new () => object;
  FileSystemUploadTask: new () => object;
  FileSystemWatcher: new (path: string, options?: {debounce?: number; events?: string[]}) => object;
  readonly cacheDirectory: string | null;
  readonly documentDirectory: string | null;
  readonly bundleDirectory: string | null;
  readonly appleSharedContainers: Record<string, string>;
  readonly totalDiskSpace: number;
  readonly availableDiskSpace: number;
  info(path: string): {exists: boolean; isDirectory: boolean};
  downloadFileAsync(url: string, to: Entry, options?: {headers?: Record<string, string>}, uuid?: string): Promise<string>;
  cancelDownloadAsync(uuid: string): Promise<void>;
  pickFileAsync(options?: {initialUri?: string; mimeTypes?: string | string[]; multipleFiles?: boolean}): Promise<{uri: string} | {uri: string}[]>;
  pickDirectoryAsync(initialUri?: string): Promise<{uri: string}>;
}

function entryInfo(uri: string): EntryInfo {
  return unwrap(library('info').info(uri));
}

/** A download or an upload in flight: its id, and its progress relayed to the task's listeners. */
function progressRelay(taskId: string, emit: (data: Record<string, number>) => void): EmitterSubscription {
  return DeviceEventEmitter.addListener('onFileSystemProgress', (event: {taskId: string} & Record<string, number | string>) => {
    if (event.taskId !== taskId) return;
    const {taskId: _id, ...data} = event;
    emit(data as Record<string, number>);
  });
}

/**
 * `FileSystem`, what `expo-file-system` builds its `File`, `Directory`,
 * `Paths` and network tasks on: the classes the package extends, over the
 * runtime's library — files and directories by `file:` URI in the app's
 * local data or anywhere the user's account reaches, handles for byte
 * ranges, downloads and uploads with progress, the file and folder pickers
 * and a directory watcher. The synchronous calls are synchronous through
 * the library, as the package's API promises.
 */
export function createFileSystemModule(): ExpoFileSystemModule {
  const Base = nativeModuleClass();
  const Shared = globalThis.expo.SharedObject as typeof SharedObject;

  class FileSystemFile extends Shared {
    private _uri: string;
    constructor(uri: string) {
      super();
      this._uri = fileUri(uri);
    }
    get uri(): string {
      return this._uri;
    }
    validatePath(): void {
      const info = native.fileSystem() ? entryInfo(this._uri) : null;
      if (info?.exists && info.isDirectory) throw new Error(`A directory is at ${this._uri}; use Directory`);
    }
    get exists(): boolean {
      const info = entryInfo(this._uri);
      return info.exists && !info.isDirectory;
    }
    get size(): number {
      return entryInfo(this._uri).size;
    }
    get md5(): string | null {
      return this.exists ? unwrap(library('md5').md5(this._uri)) : null;
    }
    get modificationTime(): number | null {
      const info = entryInfo(this._uri);
      return info.exists ? info.modificationTime : null;
    }
    get lastModified(): number | null {
      return this.modificationTime;
    }
    get creationTime(): number | null {
      const info = entryInfo(this._uri);
      return info.exists ? info.creationTime : null;
    }
    get type(): string {
      return entryInfo(this._uri).type;
    }
    get contentUri(): string {
      return this._uri;
    }
    textSync(): string {
      return unwrap(library('text').readText(this._uri));
    }
    async text(): Promise<string> {
      return this.textSync();
    }
    base64Sync(): string {
      return unwrap(library('base64').readBase64(this._uri));
    }
    async base64(): Promise<string> {
      return this.base64Sync();
    }
    bytesSync(): Uint8Array {
      return base64Decode(this.base64Sync());
    }
    async bytes(): Promise<Uint8Array> {
      return this.bytesSync();
    }
    write(content: string | Uint8Array, options: WriteOptions = {}): void {
      const append = options.append ?? false;
      if (typeof content === 'string') unwrap(library('write').write(this._uri, content, options.encoding === 'base64', append));
      else unwrap(library('write').write(this._uri, base64Encode(content), true, append));
    }
    delete(): void {
      unwrap(library('delete').remove(this._uri, false));
    }
    create(options: {overwrite?: boolean; intermediates?: boolean} = {}): void {
      unwrap(library('create').createFile(this._uri, options.overwrite ?? false, options.intermediates ?? false));
    }
    info(options: {md5?: boolean} = {}): FileInfo {
      const info = entryInfo(this._uri);
      if (!info.exists || info.isDirectory) return {exists: false};
      const result: FileInfo = {exists: true, uri: this._uri, size: info.size, modificationTime: info.modificationTime, creationTime: info.creationTime};
      if (options.md5) result.md5 = unwrap(library('info').md5(this._uri));
      return result;
    }
    copySync(destination: Entry, options: RelocationOptions = {}): void {
      unwrap(library('copy').copy(this._uri, destination.uri, options.overwrite ?? false));
    }
    async copy(destination: Entry, options?: RelocationOptions): Promise<void> {
      this.copySync(destination, options);
    }
    moveSync(destination: Entry, options: RelocationOptions = {}): void {
      this._uri = fileUri(unwrap(library('move').move(this._uri, destination.uri, options.overwrite ?? false)));
    }
    async move(destination: Entry, options?: RelocationOptions): Promise<void> {
      this.moveSync(destination, options);
    }
    rename(newName: string): void {
      this.moveSync({uri: childUri(parentUri(this._uri), newName)});
    }
    open(mode = 'r'): FileHandle {
      const fileSystem = library('open');
      const id = unwrap(fileSystem.open(this._uri, mode));
      let closed = false;
      const info = () => (closed ? null : unwrap(fileSystem.handleInfo(id)));
      return {
        readBytes: length => base64Decode(unwrap(fileSystem.readBytes(id, length))),
        writeBytes: bytes => unwrap(fileSystem.writeBytes(id, base64Encode(bytes))),
        close: () => {
          unwrap(fileSystem.close(id));
          closed = true;
        },
        get offset() {
          return info()?.offset ?? null;
        },
        set offset(value: number | null) {
          if (value !== null && !closed) unwrap(fileSystem.seek(id, value));
        },
        get size() {
          return info()?.size ?? null;
        },
      };
    }
  }

  class FileSystemDirectory extends Shared {
    private _uri: string;
    constructor(uri: string) {
      super();
      this._uri = directoryUri(uri);
    }
    get uri(): string {
      return this._uri;
    }
    validatePath(): void {
      const info = native.fileSystem() ? entryInfo(this._uri) : null;
      if (info?.exists && !info.isDirectory) throw new Error(`A file is at ${this._uri}; use File`);
    }
    get exists(): boolean {
      const info = entryInfo(this._uri);
      return info.exists && info.isDirectory;
    }
    get size(): number | null {
      const info = entryInfo(this._uri);
      return info.exists ? info.size : null;
    }
    delete(): void {
      unwrap(library('delete').remove(this._uri, false));
    }
    create(options: {overwrite?: boolean; intermediates?: boolean; idempotent?: boolean} = {}): void {
      unwrap(library('create').createDirectory(this._uri, options.overwrite ?? false, options.intermediates ?? false, options.idempotent ?? false));
    }
    createFile(name: string, _mimeType: string | null): Entry {
      return {uri: childUri(this._uri, name)};
    }
    createDirectory(name: string): Entry {
      return {uri: directoryUri(childUri(this._uri, name))};
    }
    copySync(destination: Entry, options: RelocationOptions = {}): void {
      unwrap(library('copy').copy(this._uri, destination.uri, options.overwrite ?? false));
    }
    async copy(destination: Entry, options?: RelocationOptions): Promise<void> {
      this.copySync(destination, options);
    }
    moveSync(destination: Entry, options: RelocationOptions = {}): void {
      this._uri = directoryUri(unwrap(library('move').move(this._uri, destination.uri, options.overwrite ?? false)));
    }
    async move(destination: Entry, options?: RelocationOptions): Promise<void> {
      this.moveSync(destination, options);
    }
    rename(newName: string): void {
      this.moveSync({uri: childUri(parentUri(this._uri), newName)});
    }
    listAsRecords(): {isDirectory: boolean; uri: string}[] {
      return unwrap(library('list').list(this._uri));
    }
    info(): DirectoryInfo {
      const info = entryInfo(this._uri);
      if (!info.exists || !info.isDirectory) return {exists: false};
      return {
        exists: true,
        uri: this._uri,
        size: info.size,
        modificationTime: info.modificationTime,
        creationTime: info.creationTime,
        files: this.listAsRecords().map(entry => nameOf(entry.uri)),
      };
    }
  }

  type DownloadEvents = {progress(data: {bytesWritten: number; totalBytes: number}): void};
  class FileSystemDownloadTask extends Shared<DownloadEvents> {
    private taskId: string | null = null;
    async start(url: string, to: Entry, options: {headers?: Record<string, string>} = {}): Promise<string | null> {
      const fileSystem = library('DownloadTask.start');
      this.taskId = uuidv4();
      const relay = progressRelay(this.taskId, data => this.emit('progress', data as {bytesWritten: number; totalBytes: number}));
      try {
        return await fileSystem.download(url, to.uri, options.headers ?? {}, this.taskId);
      } finally {
        relay.remove();
        this.taskId = null;
      }
    }
    pause(): Promise<never> {
      return Promise.reject(new UnavailabilityError(FILE_SYSTEM, 'DownloadTask.pause'));
    }
    resume(): Promise<never> {
      return Promise.reject(new UnavailabilityError(FILE_SYSTEM, 'DownloadTask.resume'));
    }
    cancel(): void {
      if (this.taskId) native.fileSystem()?.cancel(this.taskId);
    }
  }

  type UploadEvents = {progress(data: {bytesSent: number; totalBytes: number}): void};
  class FileSystemUploadTask extends Shared<UploadEvents> {
    private taskId: string | null = null;
    async start(url: string, file: Entry, options: Record<string, unknown> = {}): Promise<{status: number; headers: Record<string, string>; body: string}> {
      const fileSystem = library('UploadTask.start');
      this.taskId = uuidv4();
      const relay = progressRelay(this.taskId, data => this.emit('progress', data as {bytesSent: number; totalBytes: number}));
      try {
        return await fileSystem.upload(url, file.uri, options, this.taskId);
      } finally {
        relay.remove();
        this.taskId = null;
      }
    }
    cancel(): void {
      if (this.taskId) native.fileSystem()?.cancel(this.taskId);
    }
  }

  type WatcherEvents = {change(event: Omit<WatchEvent, 'id'>): void};
  let lastWatch = 0;
  class FileSystemWatcher extends Shared<WatcherEvents> {
    private readonly id = ++lastWatch;
    private subscription: EmitterSubscription | null = null;
    private readonly recent = new Map<string, ReturnType<typeof setTimeout>>();
    constructor(
      private readonly path: string,
      private readonly options: {debounce?: number; events?: string[]} = {},
    ) {
      super();
    }
    start(): void {
      const fileSystem = library('watch');
      this.subscription ??= DeviceEventEmitter.addListener('onFileSystemChange', (event: WatchEvent) => {
        if (event.id !== this.id) return;
        const {id: _id, ...change} = event;
        // A burst of the same change on the same path within the debounce window is one change.
        const key = `${change.type} ${change.path}`;
        const debounce = this.options.debounce ?? 0;
        if (debounce > 0) {
          if (this.recent.has(key)) return;
          this.recent.set(key, setTimeout(() => this.recent.delete(key), debounce));
        }
        this.emit('change', change);
      });
      try {
        unwrap(fileSystem.watch(this.id, this.path));
      } catch (error) {
        this.stop();
        throw error;
      }
    }
    stop(): void {
      this.subscription?.remove();
      this.subscription = null;
      for (const timer of this.recent.values()) clearTimeout(timer);
      this.recent.clear();
      native.fileSystem()?.unwatch(this.id);
    }
  }

  const constants = () => native.fileSystem()?.getConstants() ?? {};

  class Module extends Base<FileSystemEvents> implements ExpoFileSystemModule {
    readonly FileSystemFile = FileSystemFile;
    readonly FileSystemDirectory = FileSystemDirectory;
    readonly FileSystemDownloadTask = FileSystemDownloadTask;
    readonly FileSystemUploadTask = FileSystemUploadTask;
    readonly FileSystemWatcher = FileSystemWatcher;
    readonly appleSharedContainers = {};
    private readonly downloads = new Map<string, FileSystemDownloadTask>();

    get cacheDirectory(): string | null {
      return constants().cacheDirectory ?? null;
    }
    get documentDirectory(): string | null {
      return constants().documentDirectory ?? null;
    }
    get bundleDirectory(): string | null {
      return constants().bundleDirectory ?? null;
    }
    get totalDiskSpace(): number {
      return constants().totalDiskSpace ?? 0;
    }
    get availableDiskSpace(): number {
      return constants().availableDiskSpace ?? 0;
    }
    info(path: string): {exists: boolean; isDirectory: boolean} {
      const info = entryInfo(path);
      return {exists: info.exists, isDirectory: info.isDirectory};
    }
    async downloadFileAsync(url: string, to: Entry, options: {headers?: Record<string, string>} = {}, uuid?: string): Promise<string> {
      const task = new FileSystemDownloadTask();
      const subscription = uuid
        ? task.addListener('progress', data => this.emit('downloadProgress', {uuid, data}))
        : null;
      if (uuid) this.downloads.set(uuid, task);
      try {
        return (await task.start(url, to, options)) as string;
      } finally {
        subscription?.remove();
        if (uuid) this.downloads.delete(uuid);
      }
    }
    async cancelDownloadAsync(uuid: string): Promise<void> {
      this.downloads.get(uuid)?.cancel();
    }
    async pickFileAsync(options: {initialUri?: string; mimeTypes?: string | string[]; multipleFiles?: boolean} = {}): Promise<{uri: string} | {uri: string}[]> {
      const types = options.mimeTypes === undefined ? [] : Array.isArray(options.mimeTypes) ? options.mimeTypes : [options.mimeTypes];
      return library('pickFileAsync').pickFile(options.initialUri ?? '', types, options.multipleFiles ?? false);
    }
    async pickDirectoryAsync(initialUri = ''): Promise<{uri: string}> {
      return library('pickDirectoryAsync').pickDirectory(initialUri);
    }
  }
  return new Module();
}

/** `expo-file-system/legacy`'s `FileInfo`, whose times are in seconds. */
type LegacyInfo = {exists: boolean; uri: string; isDirectory: boolean; size?: number; modificationTime?: number; md5?: string};

/**
 * `ExponentFileSystem`, the legacy module of `expo-file-system` — the
 * string-URI API older libraries still call — over the same library: info,
 * text in UTF-8 or base64, directories, copies and moves, downloads and
 * uploads, the disk. What the legacy API has no Windows answer for (the
 * Android storage framework, resumable downloads) it reports unavailable.
 */
export function createLegacyFileSystemModule(): InstanceType<NativeModule> {
  const Base = nativeModuleClass();
  const constants = () => native.fileSystem()?.getConstants() ?? {};
  class Module extends Base {
    get cacheDirectory(): string | null {
      return constants().cacheDirectory ?? null;
    }
    get documentDirectory(): string | null {
      return constants().documentDirectory ?? null;
    }
    get bundleDirectory(): string | null {
      return constants().bundleDirectory ?? null;
    }
    async getInfoAsync(uri: string, options: {md5?: boolean} = {}): Promise<LegacyInfo> {
      const info = unwrap(library('getInfoAsync').info(uri));
      if (!info.exists) return {exists: false, uri, isDirectory: false};
      const result: LegacyInfo = {exists: true, uri: info.uri, isDirectory: info.isDirectory, size: info.size, modificationTime: info.modificationTime / 1000};
      if (options.md5 && !info.isDirectory) result.md5 = unwrap(library('getInfoAsync').md5(uri));
      return result;
    }
    async readAsStringAsync(uri: string, options: {encoding?: string} = {}): Promise<string> {
      const fileSystem = library('readAsStringAsync');
      return options.encoding === 'base64' ? unwrap(fileSystem.readBase64(uri)) : unwrap(fileSystem.readText(uri));
    }
    async writeAsStringAsync(uri: string, contents: string, options: {encoding?: string} = {}): Promise<void> {
      unwrap(library('writeAsStringAsync').write(uri, contents, options.encoding === 'base64', false));
    }
    async deleteAsync(uri: string, options: {idempotent?: boolean} = {}): Promise<void> {
      unwrap(library('deleteAsync').remove(uri, options.idempotent ?? false));
    }
    async makeDirectoryAsync(uri: string, options: {intermediates?: boolean} = {}): Promise<void> {
      unwrap(library('makeDirectoryAsync').createDirectory(uri, false, options.intermediates ?? false, false));
    }
    async readDirectoryAsync(uri: string): Promise<string[]> {
      return unwrap(library('readDirectoryAsync').list(uri)).map(entry => nameOf(entry.uri));
    }
    async copyAsync(options: {from: string; to: string}): Promise<void> {
      unwrap(library('copyAsync').copy(options.from, options.to, true));
    }
    async moveAsync(options: {from: string; to: string}): Promise<void> {
      unwrap(library('moveAsync').move(options.from, options.to, true));
    }
    async downloadAsync(url: string, fileUri: string, options: {headers?: Record<string, string>; md5?: boolean} = {}): Promise<{uri: string; status: number; headers: Record<string, string>; md5?: string}> {
      const fileSystem = library('downloadAsync');
      const uri = await fileSystem.download(url, fileUri, options.headers ?? {}, uuidv4());
      const result: {uri: string; status: number; headers: Record<string, string>; md5?: string} = {uri, status: 200, headers: {}};
      if (options.md5) result.md5 = unwrap(fileSystem.md5(uri));
      return result;
    }
    async uploadAsync(url: string, fileUri: string, options: Record<string, unknown> = {}): Promise<{status: number; headers: Record<string, string>; body: string}> {
      return library('uploadAsync').upload(url, fileUri, options, uuidv4());
    }
    async getFreeDiskStorageAsync(): Promise<number> {
      return constants().availableDiskSpace ?? 0;
    }
    async getTotalDiskCapacityAsync(): Promise<number> {
      return constants().totalDiskSpace ?? 0;
    }
  }
  return new Module();
}

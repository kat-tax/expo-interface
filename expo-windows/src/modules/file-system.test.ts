import type {EntryInfo, NativeFileSystem} from '../native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {base64Decode, base64Encode, utf8Decode, utf8Encode} from '../bytes';
import {childUri, createFileSystemModule, createLegacyFileSystemModule, directoryUri, fileUri, nameOf, parentUri} from './file-system';

const CACHE = 'file:///C:/Users/me/AppData/Local/Drops/cache/';

/** A library over a map of entries: files hold bytes, directories hold nothing. */
function withLibrary() {
  const files = new Map<string, Uint8Array>();
  const directories = new Set<string>([CACHE]);
  const handles = new Map<number, {uri: string; offset: number}>();
  let next = 0;
  const key = (uri: string) => uri.replace(/\/+$/, '');
  const ok = <T>(value: T) => ({value});
  const fail = (error: string) => ({error});
  const info = (uri: string): EntryInfo => {
    const k = key(uri);
    if (files.has(k)) return {exists: true, isDirectory: false, uri: k, size: files.get(k)!.length, modificationTime: 1000, creationTime: 500, type: k.endsWith('.txt') ? 'text/plain' : ''};
    if (directories.has(`${k}/`)) return {exists: true, isDirectory: true, uri: `${k}/`, size: 7, modificationTime: 2000, creationTime: 600, type: ''};
    return {exists: false, isDirectory: false, uri, size: 0, modificationTime: 0, creationTime: 0, type: ''};
  };
  const library: NativeFileSystem = {
    getConstants: () => ({cacheDirectory: CACHE, documentDirectory: 'file:///C:/Users/me/AppData/Local/Drops/documents/', bundleDirectory: 'file:///C:/Program%20Files/Drops/', totalDiskSpace: 1000, availableDiskSpace: 400}),
    info: uri => ok(info(uri)),
    readText: uri => (files.has(key(uri)) ? ok(utf8Decode(files.get(key(uri))!)) : fail('The file could not be read')),
    readBase64: uri => (files.has(key(uri)) ? ok(base64Encode(files.get(key(uri))!)) : fail('The file could not be read')),
    write: (uri, content, base64, append) => {
      const bytes = base64 ? base64Decode(content) : utf8Encode(content);
      const previous = append ? (files.get(key(uri)) ?? new Uint8Array()) : new Uint8Array();
      files.set(key(uri), new Uint8Array([...previous, ...bytes]));
      return ok(null);
    },
    md5: uri => ok(`md5-of-${nameOf(uri)}`),
    createFile: (uri, overwrite) => {
      if (files.has(key(uri)) && !overwrite) return fail('The file already exists');
      files.set(key(uri), new Uint8Array());
      return ok(null);
    },
    createDirectory: (uri, overwrite, _intermediates, idempotent) => {
      if (directories.has(directoryUri(uri)) && !overwrite && !idempotent) return fail('The directory already exists');
      directories.add(directoryUri(uri));
      return ok(null);
    },
    remove: (uri, idempotent) => {
      const k = key(uri);
      if (!files.has(k) && !directories.has(`${k}/`)) return idempotent ? ok(null) : fail('Nothing to delete');
      files.delete(k);
      directories.delete(`${k}/`);
      return ok(null);
    },
    copy: (from, to, overwrite) => {
      const target = directories.has(directoryUri(to)) ? childUri(to, nameOf(from)) : key(to);
      if (files.has(target) && !overwrite) return fail('The destination already exists');
      if (files.has(key(from))) files.set(target, files.get(key(from))!);
      else directories.add(`${target}/`);
      return ok(files.has(target) ? target : `${target}/`);
    },
    move: (from, to, overwrite) => {
      const copied = library.copy(from, to, overwrite);
      if (copied.error) return copied;
      library.remove(from, false);
      return copied;
    },
    list: uri => (directories.has(directoryUri(uri)) ? ok([...files.keys()].filter(k => parentUri(k) === directoryUri(uri)).map(k => ({uri: k, isDirectory: false}))) : fail('Not a directory')),
    open: (uri, mode) => {
      if (mode === 'r' && !files.has(key(uri))) return fail('The file could not be opened');
      if (!files.has(key(uri))) files.set(key(uri), new Uint8Array());
      handles.set(++next, {uri: key(uri), offset: 0});
      return ok(next);
    },
    readBytes: (handle, length) => {
      const h = handles.get(handle);
      if (!h) return fail('The file handle is closed');
      const bytes = files.get(h.uri)!.subarray(h.offset, h.offset + length);
      h.offset += bytes.length;
      return ok(base64Encode(bytes));
    },
    writeBytes: (handle, base64) => {
      const h = handles.get(handle);
      if (!h) return fail('The file handle is closed');
      const bytes = base64Decode(base64);
      const current = files.get(h.uri)!;
      const out = new Uint8Array(Math.max(current.length, h.offset + bytes.length));
      out.set(current);
      out.set(bytes, h.offset);
      files.set(h.uri, out);
      h.offset += bytes.length;
      return ok(null);
    },
    handleInfo: handle => (handles.has(handle) ? ok({offset: handles.get(handle)!.offset, size: files.get(handles.get(handle)!.uri)!.length}) : fail('The file handle is closed')),
    seek: (handle, offset) => {
      handles.get(handle)!.offset = offset;
      return ok(null);
    },
    close: handle => {
      handles.delete(handle);
      return ok(null);
    },
    download: vi.fn(async (url: string, toUri: string, _headers: Record<string, string>, taskId: string) => {
      DeviceEventEmitter.emit('onFileSystemProgress', {taskId, bytesWritten: 5, totalBytes: 10});
      DeviceEventEmitter.emit('onFileSystemProgress', {taskId: 'someone-else', bytesWritten: 1, totalBytes: 1});
      if (url.endsWith('fail')) throw new Error('The download answered 404');
      const target = toUri.endsWith('/') ? childUri(toUri, 'file.bin') : toUri;
      files.set(key(target), utf8Encode('downloaded'));
      return key(target);
    }),
    upload: vi.fn(async (_url: string, _fileUri: string, _options: Record<string, unknown>, taskId: string) => {
      DeviceEventEmitter.emit('onFileSystemProgress', {taskId, bytesSent: 3, totalBytes: 3});
      return {status: 201, headers: {'x-id': '7'}, body: 'ok'};
    }),
    cancel: vi.fn(),
    pickFile: vi.fn(async (_initial: string, _types: string[], multiple: boolean) => (multiple ? [{uri: 'file:///C:/a.txt'}, {uri: 'file:///C:/b.txt'}] : {uri: 'file:///C:/a.txt'})),
    pickDirectory: vi.fn(async () => ({uri: 'file:///C:/dir/'})),
    watch: vi.fn((_id: number, uri: string) => (uri.includes('missing') ? fail('Nothing to watch') : ok(null))),
    unwatch: vi.fn(() => ok(null)),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsFileSystem' ? library : null) as never);
  return {library, files, directories};
}

type File = {
  uri: string;
  validatePath(): void;
  exists: boolean;
  size: number;
  md5: string | null;
  modificationTime: number | null;
  lastModified: number | null;
  creationTime: number | null;
  type: string;
  contentUri: string;
  textSync(): string;
  text(): Promise<string>;
  base64Sync(): string;
  base64(): Promise<string>;
  bytesSync(): Uint8Array;
  bytes(): Promise<Uint8Array>;
  write(content: string | Uint8Array, options?: {encoding?: 'utf8' | 'base64'; append?: boolean}): void;
  delete(): void;
  create(options?: {overwrite?: boolean; intermediates?: boolean}): void;
  info(options?: {md5?: boolean}): Record<string, unknown>;
  copy(destination: {uri: string}, options?: {overwrite?: boolean}): Promise<void>;
  copySync(destination: {uri: string}, options?: {overwrite?: boolean}): void;
  move(destination: {uri: string}, options?: {overwrite?: boolean}): Promise<void>;
  moveSync(destination: {uri: string}, options?: {overwrite?: boolean}): void;
  rename(name: string): void;
  open(mode?: string): {readBytes(length: number): Uint8Array; writeBytes(bytes: Uint8Array): void; close(): void; offset: number | null; size: number | null};
};

type Directory = {
  uri: string;
  validatePath(): void;
  exists: boolean;
  size: number | null;
  delete(): void;
  create(options?: {overwrite?: boolean; intermediates?: boolean; idempotent?: boolean}): void;
  createFile(name: string, mimeType: string | null): {uri: string};
  createDirectory(name: string): {uri: string};
  copy(destination: {uri: string}, options?: {overwrite?: boolean}): Promise<void>;
  copySync(destination: {uri: string}): void;
  move(destination: {uri: string}): Promise<void>;
  moveSync(destination: {uri: string}): void;
  rename(name: string): void;
  listAsRecords(): {uri: string; isDirectory: boolean}[];
  info(): Record<string, unknown>;
};

describe('the URI helpers (windows)', () => {
  it('shape file and directory URIs and name their parts', () => {
    expect(directoryUri('file:///C:/a')).toBe('file:///C:/a/');
    expect(directoryUri('file:///C:/a/')).toBe('file:///C:/a/');
    expect(fileUri('file:///C:/a/')).toBe('file:///C:/a');
    expect(nameOf('file:///C:/a/My%20File.txt')).toBe('My File.txt');
    expect(nameOf('file:///C:/a/dir/')).toBe('dir');
    expect(childUri('file:///C:/a', 'My File #1.txt')).toBe('file:///C:/a/My%20File%20%231.txt');
    expect(parentUri('file:///C:/a/b/c.txt')).toBe('file:///C:/a/b/');
    expect(parentUri('file:///C:/a/b/')).toBe('file:///C:/a/');
  });
});

describe('FileSystem (windows)', () => {
  it('has the app\'s folders and the disk as constants, and answers what is at a path', () => {
    withLibrary();
    const module = createFileSystemModule();
    expect(module.cacheDirectory).toBe(CACHE);
    expect(module.documentDirectory).toMatch(/documents\/$/);
    expect(module.bundleDirectory).toMatch(/^file:\/\/\/C:\/Program%20Files/);
    expect(module.totalDiskSpace).toBe(1000);
    expect(module.availableDiskSpace).toBe(400);
    expect(module.appleSharedContainers).toEqual({});
    expect(module.info(CACHE)).toEqual({exists: true, isDirectory: true});
    expect(module.info(`${CACHE}nothing.txt`)).toEqual({exists: false, isDirectory: false});
  });

  it('reads, writes, describes, copies, moves, renames and deletes a file', async () => {
    const {files} = withLibrary();
    const module = createFileSystemModule();
    const file = new module.FileSystemFile(`${CACHE}notes.txt`) as File;
    expect(file.uri).toBe(`${CACHE}notes.txt`);
    expect(file.exists).toBe(false);
    expect(file.info()).toEqual({exists: false});
    expect(file.md5).toBeNull();
    expect(file.modificationTime).toBeNull();
    expect(file.lastModified).toBeNull();
    expect(file.creationTime).toBeNull();
    expect(() => file.validatePath()).not.toThrow();
    file.create();
    expect(() => file.create()).toThrow(/already exists/);
    expect(() => file.create({overwrite: true})).not.toThrow();
    file.write('héllo');
    expect(file.textSync()).toBe('héllo');
    await expect(file.text()).resolves.toBe('héllo');
    file.write(' world', {append: true});
    await expect(file.text()).resolves.toBe('héllo world');
    file.write(base64Encode(utf8Encode('b64')), {encoding: 'base64'});
    expect(file.textSync()).toBe('b64');
    file.write(new Uint8Array([1, 2, 3]));
    expect([...file.bytesSync()]).toEqual([1, 2, 3]);
    expect([...(await file.bytes())]).toEqual([1, 2, 3]);
    expect(file.base64Sync()).toBe(base64Encode(new Uint8Array([1, 2, 3])));
    await expect(file.base64()).resolves.toBe(base64Encode(new Uint8Array([1, 2, 3])));
    expect(file.exists).toBe(true);
    expect(file.size).toBe(3);
    expect(file.type).toBe('text/plain');
    expect(file.contentUri).toBe(file.uri);
    expect(file.md5).toBe('md5-of-notes.txt');
    expect(file.modificationTime).toBe(1000);
    expect(file.lastModified).toBe(1000);
    expect(file.creationTime).toBe(500);
    expect(file.info()).toEqual({exists: true, uri: file.uri, size: 3, modificationTime: 1000, creationTime: 500});
    expect(file.info({md5: true})).toMatchObject({md5: 'md5-of-notes.txt'});
    // Copies keep the file where it is; moves and renames take it along.
    await file.copy({uri: `${CACHE}copy.txt`});
    expect(files.has(`${CACHE}copy.txt`)).toBe(true);
    expect(file.uri).toBe(`${CACHE}notes.txt`);
    expect(() => file.copySync({uri: `${CACHE}copy.txt`})).toThrow(/already exists/);
    file.copySync({uri: `${CACHE}copy.txt`}, {overwrite: true});
    (new module.FileSystemDirectory(`${CACHE}moved/`) as Directory).create();
    await file.move({uri: CACHE + 'moved/'});
    expect(file.uri).toBe(`${CACHE}moved/notes.txt`);
    file.rename('renamed.txt');
    expect(file.uri).toBe(`${CACHE}moved/renamed.txt`);
    file.moveSync({uri: `${CACHE}back.txt`}, {overwrite: true});
    expect(file.uri).toBe(`${CACHE}back.txt`);
    file.delete();
    expect(file.exists).toBe(false);
    expect(() => file.delete()).toThrow(/Nothing to delete/);
    expect(() => file.textSync()).toThrow(/could not be read/);
    // A directory at the path is the other class's business.
    const wrong = new module.FileSystemFile(CACHE) as File;
    expect(() => wrong.validatePath()).toThrow(/use Directory/);
  });

  it('opens a file as a handle for byte ranges', () => {
    withLibrary();
    const module = createFileSystemModule();
    const file = new module.FileSystemFile(`${CACHE}bytes.bin`) as File;
    file.write(new Uint8Array([10, 20, 30, 40]));
    const handle = file.open('r');
    expect(handle.size).toBe(4);
    expect(handle.offset).toBe(0);
    expect([...handle.readBytes(2)]).toEqual([10, 20]);
    expect(handle.offset).toBe(2);
    handle.offset = 3;
    expect([...handle.readBytes(5)]).toEqual([40]);
    handle.close();
    expect(handle.offset).toBeNull();
    expect(handle.size).toBeNull();
    handle.offset = 1; // nothing to seek in
    expect(() => handle.readBytes(1)).toThrow(/closed/);
    const writer = file.open('rw');
    writer.offset = 4;
    writer.writeBytes(new Uint8Array([50]));
    writer.close();
    expect([...file.bytesSync()]).toEqual([10, 20, 30, 40, 50]);
    expect(file.open().size).toBe(5);
    expect(() => (new module.FileSystemFile(`${CACHE}missing.bin`) as File).open('r')).toThrow(/could not be opened/);
  });

  it('creates, lists, describes, copies, moves and deletes a directory', async () => {
    const {directories} = withLibrary();
    const module = createFileSystemModule();
    const directory = new module.FileSystemDirectory(`${CACHE}photos`) as Directory;
    expect(directory.uri).toBe(`${CACHE}photos/`);
    expect(directory.exists).toBe(false);
    expect(directory.size).toBeNull();
    expect(directory.info()).toEqual({exists: false});
    expect(() => directory.validatePath()).not.toThrow();
    directory.create();
    expect(() => directory.create()).toThrow(/already exists/);
    expect(() => directory.create({idempotent: true})).not.toThrow();
    expect(directory.exists).toBe(true);
    expect(directory.size).toBe(7);
    expect(directory.createFile('a b.txt', 'text/plain')).toEqual({uri: `${CACHE}photos/a%20b.txt`});
    expect(directory.createDirectory('inner')).toEqual({uri: `${CACHE}photos/inner/`});
    (new module.FileSystemFile(`${CACHE}photos/one.txt`) as File).write('1');
    expect(directory.listAsRecords()).toEqual([{uri: `${CACHE}photos/one.txt`, isDirectory: false}]);
    expect(directory.info()).toEqual({exists: true, uri: directory.uri, size: 7, modificationTime: 2000, creationTime: 600, files: ['one.txt']});
    await directory.copy({uri: `${CACHE}photos-copy/`});
    expect(directories.has(`${CACHE}photos-copy/`)).toBe(true);
    directory.copySync({uri: `${CACHE}photos-copy-2/`});
    await directory.move({uri: `${CACHE}albums/`});
    expect(directory.uri).toBe(`${CACHE}albums/`);
    directory.moveSync({uri: `${CACHE}albums-2/`});
    expect(directory.uri).toBe(`${CACHE}albums-2/`);
    directory.rename('albums-3');
    expect(directory.uri).toBe(`${CACHE}albums-3/`);
    directory.delete();
    expect(directory.exists).toBe(false);
    expect(() => directory.listAsRecords()).toThrow(/Not a directory/);
    const wrong = new module.FileSystemDirectory(`${CACHE}photos/one.txt`) as Directory;
    expect(() => wrong.validatePath()).toThrow(/use File/);
  });

  it('downloads to a file or into a directory with progress, and can be cancelled', async () => {
    const {library} = withLibrary();
    const module = createFileSystemModule();
    const progress = vi.fn();
    const subscription = module.addListener('downloadProgress', progress);
    await expect(module.downloadFileAsync('https://x/file.bin', {uri: `${CACHE}down/`}, {}, 'u1')).resolves.toBe(`${CACHE}down/file.bin`);
    expect(progress).toHaveBeenCalledWith({uuid: 'u1', data: {bytesWritten: 5, totalBytes: 10}});
    expect(progress).toHaveBeenCalledTimes(1);
    await expect(module.downloadFileAsync('https://x/file.bin', {uri: `${CACHE}named.bin`}, {headers: {a: 'b'}})).resolves.toBe(`${CACHE}named.bin`);
    expect(library.download).toHaveBeenLastCalledWith('https://x/file.bin', `${CACHE}named.bin`, {a: 'b'}, expect.any(String));
    await expect(module.downloadFileAsync('https://x/fail', {uri: `${CACHE}x`})).rejects.toThrow(/404/);
    subscription.remove();
    // A task of its own: progress on the task, cancel through the library, pause and resume not on Windows.
    const task = new module.FileSystemDownloadTask() as {start(url: string, to: {uri: string}): Promise<string | null>; pause(): Promise<never>; resume(): Promise<never>; cancel(): void; addListener(name: 'progress', listener: (data: unknown) => void): {remove(): void}};
    const onProgress = vi.fn();
    task.addListener('progress', onProgress);
    task.cancel(); // nothing in flight
    expect(library.cancel).not.toHaveBeenCalled();
    const pending = task.start('https://x/file.bin', {uri: `${CACHE}task.bin`});
    task.cancel();
    expect(library.cancel).toHaveBeenCalledTimes(1);
    await expect(pending).resolves.toBe(`${CACHE}task.bin`);
    expect(onProgress).toHaveBeenCalledWith({bytesWritten: 5, totalBytes: 10});
    await expect(task.pause()).rejects.toThrow(/DownloadTask\.pause/);
    await expect(task.resume()).rejects.toThrow(/DownloadTask\.resume/);
    // A task started while the library was there survives its going: cancel finds nothing to call.
    const inFlight = task.start('https://x/file.bin', {uri: `${CACHE}task2.bin`});
    const get = vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(() => task.cancel()).not.toThrow();
    get.mockImplementation(name => (name === 'ExpoWindowsFileSystem' ? library : null) as never);
    await expect(inFlight).resolves.toBe(`${CACHE}task2.bin`);
    expect(library.cancel).toHaveBeenCalledTimes(1);
    await module.cancelDownloadAsync('nobody');
    const cancelling = module.downloadFileAsync('https://x/file.bin', {uri: `${CACHE}c.bin`}, {}, 'u2');
    await module.cancelDownloadAsync('u2');
    expect(library.cancel).toHaveBeenCalledTimes(2);
    await cancelling;
  });

  it('uploads a file with progress, and picks files and folders through the library', async () => {
    const {library} = withLibrary();
    const module = createFileSystemModule();
    const task = new module.FileSystemUploadTask() as {start(url: string, file: {uri: string}, options?: Record<string, unknown>): Promise<unknown>; cancel(): void; addListener(name: 'progress', listener: (data: unknown) => void): {remove(): void}};
    const onProgress = vi.fn();
    task.addListener('progress', onProgress);
    await expect(task.start('https://x/up', {uri: `${CACHE}a.txt`}, {httpMethod: 'PUT'})).resolves.toEqual({status: 201, headers: {'x-id': '7'}, body: 'ok'});
    expect(library.upload).toHaveBeenCalledWith('https://x/up', `${CACHE}a.txt`, {httpMethod: 'PUT'}, expect.any(String));
    expect(onProgress).toHaveBeenCalledWith({bytesSent: 3, totalBytes: 3});
    task.cancel(); // nothing in flight
    const inFlight = task.start('https://x/up', {uri: `${CACHE}a.txt`});
    task.cancel();
    expect(library.cancel).toHaveBeenCalledTimes(1);
    const get = vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(() => task.cancel()).not.toThrow(); // the library gone mid-flight: nothing to call
    get.mockImplementation(name => (name === 'ExpoWindowsFileSystem' ? library : null) as never);
    await inFlight;
    expect(library.cancel).toHaveBeenCalledTimes(1);
    await expect(module.pickFileAsync()).resolves.toEqual({uri: 'file:///C:/a.txt'});
    expect(library.pickFile).toHaveBeenLastCalledWith('', [], false);
    await expect(module.pickFileAsync({mimeTypes: 'image/*', multipleFiles: true, initialUri: 'file:///C:/'})).resolves.toHaveLength(2);
    expect(library.pickFile).toHaveBeenLastCalledWith('file:///C:/', ['image/*'], true);
    await module.pickFileAsync({mimeTypes: ['a/b', 'c/d']});
    expect(library.pickFile).toHaveBeenLastCalledWith('', ['a/b', 'c/d'], false);
    await expect(module.pickDirectoryAsync()).resolves.toEqual({uri: 'file:///C:/dir/'});
    await module.pickDirectoryAsync('file:///C:/start/');
    expect(library.pickDirectory).toHaveBeenLastCalledWith('file:///C:/start/');
  });

  it('watches a path through the library, debouncing a burst of one change', () => {
    vi.useFakeTimers();
    try {
      const {library} = withLibrary();
      const module = createFileSystemModule();
      const watcher = new module.FileSystemWatcher(`${CACHE}watched/`, {debounce: 100}) as {start(): void; stop(): void; addListener(name: 'change', listener: (event: unknown) => void): {remove(): void}};
      const onChange = vi.fn();
      watcher.addListener('change', onChange);
      watcher.start();
      expect(library.watch).toHaveBeenCalledWith(1, `${CACHE}watched/`);
      const change = {type: 'modified', path: `${CACHE}watched/a.txt`, isDirectory: false};
      DeviceEventEmitter.emit('onFileSystemChange', {id: 1, ...change});
      DeviceEventEmitter.emit('onFileSystemChange', {id: 1, ...change});
      DeviceEventEmitter.emit('onFileSystemChange', {id: 99, ...change});
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(change);
      vi.advanceTimersByTime(150);
      DeviceEventEmitter.emit('onFileSystemChange', {id: 1, ...change});
      expect(onChange).toHaveBeenCalledTimes(2);
      watcher.stop();
      expect(library.unwatch).toHaveBeenCalledWith(1);
      DeviceEventEmitter.emit('onFileSystemChange', {id: 1, ...change});
      expect(onChange).toHaveBeenCalledTimes(2);
      // Without a debounce every change comes through; a watch the library refuses throws and leaves nothing behind.
      const eager = new module.FileSystemWatcher(`${CACHE}watched/`) as {start(): void; stop(): void; addListener(name: 'change', listener: (event: unknown) => void): {remove(): void}};
      const eagerly = vi.fn();
      eager.addListener('change', eagerly);
      eager.start();
      DeviceEventEmitter.emit('onFileSystemChange', {id: 2, ...change});
      DeviceEventEmitter.emit('onFileSystemChange', {id: 2, ...change});
      expect(eagerly).toHaveBeenCalledTimes(2);
      eager.stop();
      const refused = new module.FileSystemWatcher(`${CACHE}missing/`) as {start(): void};
      expect(() => refused.start()).toThrow(/Nothing to watch/);
      expect(library.unwatch).toHaveBeenLastCalledWith(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('is unavailable without the library, apart from the shapes', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createFileSystemModule();
    expect(module.cacheDirectory).toBeNull();
    expect(module.documentDirectory).toBeNull();
    expect(module.bundleDirectory).toBeNull();
    expect(module.totalDiskSpace).toBe(0);
    expect(module.availableDiskSpace).toBe(0);
    const file = new module.FileSystemFile(`${CACHE}a.txt`) as File;
    expect(() => file.validatePath()).not.toThrow();
    expect(() => file.exists).toThrow(/FileSystem\.info/);
    expect(() => file.textSync()).toThrow(/FileSystem\.text/);
    const directory = new module.FileSystemDirectory(CACHE) as Directory;
    expect(() => directory.validatePath()).not.toThrow();
    expect(() => module.info(CACHE)).toThrow(/FileSystem\.info/);
    await expect(module.downloadFileAsync('https://x', {uri: CACHE})).rejects.toThrow(/DownloadTask\.start/);
    await expect(module.pickFileAsync()).rejects.toThrow(/pickFileAsync/);
    await expect(module.pickDirectoryAsync()).rejects.toThrow(/pickDirectoryAsync/);
    const task = new module.FileSystemUploadTask() as {start(url: string, file: {uri: string}): Promise<unknown>; cancel(): void};
    await expect(task.start('https://x', {uri: CACHE})).rejects.toThrow(/UploadTask\.start/);
    expect(() => task.cancel()).not.toThrow();
    const watcher = new module.FileSystemWatcher(CACHE) as {start(): void; stop(): void};
    expect(() => watcher.start()).toThrow(/FileSystem\.watch/);
    expect(() => watcher.stop()).not.toThrow();
  });
});

describe('ExponentFileSystem, the legacy module (windows)', () => {
  it('answers the string-URI API over the same library', async () => {
    const {library} = withLibrary();
    const legacy = createLegacyFileSystemModule() as ReturnType<typeof createLegacyFileSystemModule> & Record<string, (...args: never[]) => unknown> & {cacheDirectory: string | null; documentDirectory: string | null; bundleDirectory: string | null};
    expect(legacy.cacheDirectory).toBe(CACHE);
    expect(legacy.documentDirectory).toMatch(/documents\/$/);
    expect(legacy.bundleDirectory).toMatch(/^file:/);
    const uri = `${CACHE}legacy.txt`;
    await expect(legacy.getInfoAsync(uri as never)).resolves.toEqual({exists: false, uri, isDirectory: false});
    await legacy.writeAsStringAsync(uri as never, 'hi' as never);
    await expect(legacy.readAsStringAsync(uri as never)).resolves.toBe('hi');
    await legacy.writeAsStringAsync(uri as never, base64Encode(utf8Encode('b64')) as never, {encoding: 'base64'} as never);
    await expect(legacy.readAsStringAsync(uri as never, {encoding: 'base64'} as never)).resolves.toBe(base64Encode(utf8Encode('b64')));
    await expect(legacy.getInfoAsync(uri as never, {md5: true} as never)).resolves.toEqual({exists: true, uri, isDirectory: false, size: 3, modificationTime: 1, md5: 'md5-of-legacy.txt'});
    await legacy.makeDirectoryAsync(`${CACHE}made/` as never, {intermediates: true} as never);
    await legacy.makeDirectoryAsync(`${CACHE}made/sub/` as never);
    await expect(legacy.getInfoAsync(`${CACHE}made/` as never)).resolves.toMatchObject({exists: true, isDirectory: true});
    await legacy.copyAsync({from: uri, to: `${CACHE}made/`} as never);
    await expect(legacy.readDirectoryAsync(`${CACHE}made/` as never)).resolves.toEqual(['legacy.txt']);
    await legacy.moveAsync({from: `${CACHE}made/legacy.txt`, to: `${CACHE}moved.txt`} as never);
    await expect(legacy.readDirectoryAsync(`${CACHE}made/` as never)).resolves.toEqual([]);
    await legacy.deleteAsync(`${CACHE}moved.txt` as never);
    await expect(legacy.deleteAsync(`${CACHE}moved.txt` as never, {idempotent: true} as never)).resolves.toBeUndefined();
    await expect(legacy.downloadAsync('https://x/file.bin' as never, `${CACHE}dl.bin` as never, {md5: true} as never)).resolves.toEqual({uri: `${CACHE}dl.bin`, status: 200, headers: {}, md5: 'md5-of-dl.bin'});
    await expect(legacy.downloadAsync('https://x/file.bin' as never, `${CACHE}dl2.bin` as never)).resolves.toEqual({uri: `${CACHE}dl2.bin`, status: 200, headers: {}});
    await expect(legacy.uploadAsync('https://x/up' as never, uri as never)).resolves.toEqual({status: 201, headers: {'x-id': '7'}, body: 'ok'});
    expect(library.upload).toHaveBeenLastCalledWith('https://x/up', uri, {}, expect.any(String));
    await expect(legacy.getFreeDiskStorageAsync()).resolves.toBe(400);
    await expect(legacy.getTotalDiskCapacityAsync()).resolves.toBe(1000);
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(legacy.cacheDirectory).toBeNull();
    expect(legacy.documentDirectory).toBeNull();
    expect(legacy.bundleDirectory).toBeNull();
    await expect(legacy.getInfoAsync(uri as never)).rejects.toThrow(/getInfoAsync/);
    await expect(legacy.getFreeDiskStorageAsync()).resolves.toBe(0);
    await expect(legacy.getTotalDiskCapacityAsync()).resolves.toBe(0);
  });
});

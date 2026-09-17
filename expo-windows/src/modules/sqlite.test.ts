import type {NativeSQLite} from '../native';
import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {base64Encode} from '../bytes';
import {createSQLiteModule, NativeDatabase, NativeSession, NativeStatement} from './sqlite';

function withLibrary() {
  const sqlite: Record<keyof NativeSQLite, ReturnType<typeof vi.fn>> = {
    defaultDirectory: vi.fn(() => 'C:/Users/me/AppData/Local/App/SQLite'),
    ensureDirectory: vi.fn(() => ({value: null})),
    fileExists: vi.fn(() => false),
    deleteDatabase: vi.fn(() => ({value: null})),
    open: vi.fn(() => ({value: 1})),
    close: vi.fn(() => ({value: null})),
    exec: vi.fn(() => ({value: null})),
    inTransaction: vi.fn(() => ({value: true})),
    prepare: vi.fn(() => ({value: 7})),
    bind: vi.fn(() => ({value: null})),
    step: vi.fn(() => ({value: [1, 'a', {blob: base64Encode(new Uint8Array([9, 8]))}]})),
    all: vi.fn(() => ({value: [[1, null], [2, 'b']]})),
    run: vi.fn(() => ({value: {lastInsertRowId: 5, changes: 1, firstRowValues: [{blob: base64Encode(new Uint8Array([1]))}]}})),
    reset: vi.fn(() => ({value: null})),
    columns: vi.fn(() => ({value: ['id', 'text']})),
    finalize: vi.fn(() => ({value: null})),
    backup: vi.fn(() => ({value: null})),
    serialize: vi.fn(() => ({value: base64Encode(new Uint8Array([83, 81]))})),
    deserialize: vi.fn(() => ({value: null})),
    watchChanges: vi.fn(() => ({value: null})),
    loadExtension: vi.fn(() => ({value: null})),
  } as never;
  const files = {download: vi.fn(async () => 'file:///C:/x'), copy: vi.fn(() => ({value: 'file:///C:/x'}))};
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsSQLite' ? sqlite : name === 'ExpoWindowsFileSystem' ? files : null) as never);
  return {sqlite, files};
}

describe('ExpoSQLite (windows)', () => {
  it('opens a database at its path, loads serialized bytes, watches changes, and answers what the package asks of it', async () => {
    const {sqlite} = withLibrary();
    const database = new NativeDatabase('C:/data/app.db', {enableChangeListener: true}, new Uint8Array([1, 2]));
    await database.initAsync();
    expect(sqlite.open).toHaveBeenCalledWith('C:/data/app.db');
    expect(sqlite.deserialize).toHaveBeenCalledWith(1, 'main', base64Encode(new Uint8Array([1, 2])));
    expect(sqlite.watchChanges).toHaveBeenCalledWith(1, 'app.db', 'C:/data/app.db');
    await expect(database.isInTransactionAsync()).resolves.toBe(true);
    await database.execAsync('CREATE TABLE t (a)');
    expect(sqlite.exec).toHaveBeenCalledWith(1, 'CREATE TABLE t (a)');
    await expect(database.serializeAsync('main')).resolves.toEqual(new Uint8Array([83, 81]));
    await database.loadExtensionAsync('C:/ext.dll');
    expect(sqlite.loadExtension).toHaveBeenCalledWith(1, 'C:/ext.dll', '');
    database.loadExtensionSync('C:/ext.dll', 'entry');
    expect(sqlite.loadExtension).toHaveBeenLastCalledWith(1, 'C:/ext.dll', 'entry');
    await expect(database.createSessionAsync({}, 'main')).rejects.toThrow(/SQLite\.createSessionAsync/);
    expect(() => database.createSessionSync({}, 'main')).toThrow(/SQLite\.createSessionSync/);
    expect(() => new NativeSession()).toThrow(/SQLite\.NativeSession/);
    await database.closeAsync();
    expect(sqlite.close).toHaveBeenCalledWith(1);
    expect(database.id).toBe(-1);
    // A plain open: nothing loaded, nothing watched.
    const plain = new NativeDatabase(':memory:');
    plain.initSync();
    expect(sqlite.deserialize).toHaveBeenCalledTimes(1);
    expect(sqlite.watchChanges).toHaveBeenCalledTimes(1);
    expect(plain.databasePath).toBe(':memory:');
  });

  it('prepares, binds, runs, steps and reads statements, blobs as bytes both ways', async () => {
    const {sqlite} = withLibrary();
    const database = new NativeDatabase('C:/data/app.db');
    database.initSync();
    const statement = await database.prepareAsync(new NativeStatement(), 'SELECT * FROM t WHERE a = $a');
    expect(statement.id).toBe(7);
    expect(sqlite.prepare).toHaveBeenCalledWith(1, 'SELECT * FROM t WHERE a = $a');
    const result = await statement.runAsync(database, {a: 1, b: 'x'}, {c: new Uint8Array([4, 5])}, false);
    expect(sqlite.bind).toHaveBeenCalledWith(7, {a: 1, b: 'x'}, {c: base64Encode(new Uint8Array([4, 5]))}, false);
    expect(result).toEqual({lastInsertRowId: 5, changes: 1, firstRowValues: [new Uint8Array([1])]});
    statement.runSync(database, {0: 2}, {1: new Uint8Array([6]).buffer}, true);
    expect(sqlite.bind).toHaveBeenLastCalledWith(7, {0: 2}, {1: base64Encode(new Uint8Array([6]))}, true);
    await expect(statement.stepAsync(database)).resolves.toEqual([1, 'a', new Uint8Array([9, 8])]);
    sqlite.step.mockReturnValueOnce({value: null});
    expect(statement.stepSync(database)).toBeNull();
    await expect(statement.getAllAsync(database)).resolves.toEqual([[1, null], [2, 'b']]);
    await statement.resetAsync(database);
    expect(sqlite.reset).toHaveBeenCalledWith(7);
    await expect(statement.getColumnNamesAsync()).resolves.toEqual(['id', 'text']);
    await statement.finalizeAsync(database);
    expect(sqlite.finalize).toHaveBeenCalledWith(7);
    expect(statement.id).toBe(-1);
    // The library's error is the app's exception.
    sqlite.step.mockReturnValueOnce({error: 'no such table: t'});
    expect(() => statement.stepSync(database)).toThrow('no such table: t');
  });

  it('serves the module: directory, paths, deletion, imports, backups and the change event', async () => {
    const {sqlite, files} = withLibrary();
    const module = createSQLiteModule() as ReturnType<typeof createSQLiteModule> & {startObserving(): void; stopObserving(): void};
    expect(module.defaultDatabaseDirectory).toBe('C:/Users/me/AppData/Local/App/SQLite');
    expect(module.NativeDatabase).toBe(NativeDatabase);
    expect(module.NativeStatement).toBe(NativeStatement);
    expect(module.NativeSession).toBe(NativeSession);
    expect(module.bundledExtensions).toEqual([]);
    await module.ensureDatabasePathExistsAsync('C:/data/app.db');
    module.ensureDatabasePathExistsSync(':memory:');
    expect(sqlite.ensureDirectory).toHaveBeenCalledTimes(1);
    await module.deleteDatabaseAsync('C:/data/app.db');
    expect(sqlite.deleteDatabase).toHaveBeenCalledWith('C:/data/app.db');
    // An import: skipped when the file is there, copied from a file, downloaded from a URL.
    sqlite.fileExists.mockReturnValueOnce(true);
    await module.importAssetDatabaseAsync('C:/data/app.db', 'C:/assets/app.db', false);
    expect(files.copy).not.toHaveBeenCalled();
    await module.importAssetDatabaseAsync('C:/data/app.db', 'C:\\assets\\app.db', false);
    expect(files.copy).toHaveBeenCalledWith('file:///C:/assets/app.db', 'file:///C:/data/app.db', true);
    await module.importAssetDatabaseAsync('C:/data/app.db', 'http://localhost:8082/assets/app.db', true);
    expect(files.download).toHaveBeenCalledWith('http://localhost:8082/assets/app.db', 'file:///C:/data/app.db', {}, expect.stringMatching(/^sqlite-/));
    // Paths already given as URIs are taken as they are.
    await module.importAssetDatabaseAsync('file:///C:/data/app.db', 'file:///C:/assets/app.db', true);
    expect(files.copy).toHaveBeenLastCalledWith('file:///C:/assets/app.db', 'file:///C:/data/app.db', true);
    const source = new NativeDatabase('C:/data/app.db');
    source.initSync();
    sqlite.open.mockReturnValueOnce({value: 2});
    const destination = new NativeDatabase('C:/data/copy.db');
    destination.initSync();
    await module.backupDatabaseAsync(destination, 'main', source, 'main');
    expect(sqlite.backup).toHaveBeenCalledWith(2, 'main', 1, 'main');
    const heard = vi.fn();
    module.addListener('onDatabaseChange', heard);
    module.startObserving();
    module.startObserving();
    DeviceEventEmitter.emit('onDatabaseChange', {databaseName: 'app.db', databaseFilePath: 'C:/data/app.db', tableName: 't', rowId: 3});
    expect(heard).toHaveBeenCalledWith({databaseName: 'app.db', databaseFilePath: 'C:/data/app.db', tableName: 't', rowId: 3});
    module.stopObserving();
    module.stopObserving();
    DeviceEventEmitter.emit('onDatabaseChange', {databaseName: 'app.db', databaseFilePath: 'C:/data/app.db', tableName: 't', rowId: 4});
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('throws the package\'s error without the library, and without the file system for an import', async () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const module = createSQLiteModule();
    expect(module.defaultDatabaseDirectory).toBeNull();
    expect(() => new NativeDatabase('C:/x.db').initSync()).toThrow(/SQLite\.NativeDatabase/);
    expect(() => module.deleteDatabaseSync('C:/x.db')).toThrow(/SQLite\.NativeDatabase/);
    const sqlite = {fileExists: vi.fn(() => false), ensureDirectory: vi.fn(() => ({value: null}))};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsSQLite' ? sqlite : null) as never);
    await expect(module.importAssetDatabaseAsync('C:/x.db', 'C:/a.db', false)).rejects.toThrow(/SQLite\.importAssetDatabaseAsync/);
  });
});

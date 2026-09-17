import type {EmitterSubscription} from 'react-native';
import type {NativeModule} from 'expo-modules-core';
import type {NativeSQLite, SQLiteCell} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {base64Decode, base64Encode, bytesOf} from '../bytes';
import {native, unwrap} from '../native';
import {nativeModuleClass, UnavailabilityError} from './base';

export type OpenOptions = {enableChangeListener?: boolean; useNewConnection?: boolean; finalizeUnusedStatementsBeforeClosing?: boolean};
export type RunResult = {lastInsertRowId: number; changes: number; firstRowValues: unknown[]};
export type ChangeEvent = {databaseName: string; databaseFilePath: string; tableName: string; rowId: number};

function library(): NativeSQLite {
  const sqlite = native.sqlite();
  if (!sqlite) throw new UnavailabilityError('SQLite', 'NativeDatabase');
  return sqlite;
}

/** A cell as the package hands it to the app: a blob as bytes. */
function cell(value: SQLiteCell): unknown {
  return value !== null && typeof value === 'object' ? base64Decode(value.blob) : value;
}

function row(values: SQLiteCell[]): unknown[] {
  return values.map(cell);
}

function basename(path: string): string {
  return path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1);
}

/** A `file:` URI for a path (a drive letter is not a scheme), or the URI itself. */
function uriOf(path: string): string {
  return /^[a-z][a-z0-9+.-]+:/i.test(path) ? path : `file:///${path.replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

/**
 * The package's `NativeStatement`, over a statement handle of the runtime's
 * library: bound (blobs in base64), run to the end for its result, stepped
 * a row at a time, read whole, reset, asked its column names and finalized.
 * The asynchronous forms are the synchronous ones, answered at once.
 */
export class NativeStatement {
  id = -1;

  runSync(_database: unknown, params: Record<string, unknown>, blobs: Record<string, Uint8Array | ArrayBuffer>, asArray: boolean): RunResult {
    const sqlite = library();
    const encoded = Object.fromEntries(Object.entries(blobs).map(([key, value]) => [key, base64Encode(bytesOf(value))]));
    unwrap(sqlite.bind(this.id, params, encoded, asArray));
    const result = unwrap(sqlite.run(this.id));
    return {...result, firstRowValues: row(result.firstRowValues)};
  }

  stepSync(_database?: unknown): unknown[] | null {
    const values = unwrap(library().step(this.id));
    return values === null ? null : row(values);
  }

  getAllSync(_database?: unknown): unknown[][] {
    return unwrap(library().all(this.id)).map(row);
  }

  resetSync(_database?: unknown): void {
    unwrap(library().reset(this.id));
  }

  getColumnNamesSync(): string[] {
    return unwrap(library().columns(this.id));
  }

  finalizeSync(_database?: unknown): void {
    unwrap(library().finalize(this.id));
    this.id = -1;
  }

  async runAsync(database: unknown, params: Record<string, unknown>, blobs: Record<string, Uint8Array | ArrayBuffer>, asArray: boolean): Promise<RunResult> {
    return this.runSync(database, params, blobs, asArray);
  }

  async stepAsync(database?: unknown): Promise<unknown[] | null> {
    return this.stepSync(database);
  }

  async getAllAsync(database?: unknown): Promise<unknown[][]> {
    return this.getAllSync(database);
  }

  async resetAsync(database?: unknown): Promise<void> {
    this.resetSync(database);
  }

  async getColumnNamesAsync(): Promise<string[]> {
    return this.getColumnNamesSync();
  }

  async finalizeAsync(database?: unknown): Promise<void> {
    this.finalizeSync(database);
  }
}

/** The package's `NativeSession`: SQLite's session extension, which the system's SQLite does not carry. */
export class NativeSession {
  constructor() {
    throw new UnavailabilityError('SQLite', 'NativeSession');
  }
}

/**
 * The package's `NativeDatabase`, over a database handle of the runtime's
 * library: opened at its path (`:memory:` included) with the serialized
 * bytes given loaded into it and, when asked, its changes watched;
 * statements executed and prepared on it, its transaction state, its
 * serialization, extensions loaded where the system's SQLite allows it.
 * Sessions the system's SQLite does not carry; libSQL is another
 * platform's.
 */
export class NativeDatabase {
  id = -1;

  constructor(
    readonly databasePath: string,
    readonly options: OpenOptions = {},
    readonly serializedData?: Uint8Array,
  ) {}

  initSync(): void {
    const sqlite = library();
    this.id = unwrap(sqlite.open(this.databasePath));
    if (this.serializedData) unwrap(sqlite.deserialize(this.id, 'main', base64Encode(this.serializedData)));
    if (this.options.enableChangeListener) unwrap(sqlite.watchChanges(this.id, basename(this.databasePath), this.databasePath));
  }

  isInTransactionSync(): boolean {
    return unwrap(library().inTransaction(this.id));
  }

  closeSync(): void {
    unwrap(library().close(this.id));
    this.id = -1;
  }

  execSync(source: string): void {
    unwrap(library().exec(this.id, source));
  }

  serializeSync(databaseName: string): Uint8Array {
    return base64Decode(unwrap(library().serialize(this.id, databaseName)));
  }

  prepareSync(statement: NativeStatement, source: string): NativeStatement {
    statement.id = unwrap(library().prepare(this.id, source));
    return statement;
  }

  createSessionSync(_session: unknown, _databaseName: string): never {
    throw new UnavailabilityError('SQLite', 'createSessionSync');
  }

  loadExtensionSync(libPath: string, entryPoint?: string): void {
    unwrap(library().loadExtension(this.id, libPath, entryPoint ?? ''));
  }

  async initAsync(): Promise<void> {
    this.initSync();
  }

  async isInTransactionAsync(): Promise<boolean> {
    return this.isInTransactionSync();
  }

  async closeAsync(): Promise<void> {
    this.closeSync();
  }

  async execAsync(source: string): Promise<void> {
    this.execSync(source);
  }

  async serializeAsync(databaseName: string): Promise<Uint8Array> {
    return this.serializeSync(databaseName);
  }

  async prepareAsync(statement: NativeStatement, source: string): Promise<NativeStatement> {
    return this.prepareSync(statement, source);
  }

  async createSessionAsync(_session: unknown, _databaseName: string): Promise<never> {
    throw new UnavailabilityError('SQLite', 'createSessionAsync');
  }

  async loadExtensionAsync(libPath: string, entryPoint?: string): Promise<void> {
    this.loadExtensionSync(libPath, entryPoint);
  }
}

type SQLiteEvents = {
  onDatabaseChange(event: ChangeEvent): void;
};

export interface ExpoSQLiteModule extends InstanceType<NativeModule<SQLiteEvents>> {
  readonly NativeDatabase: typeof NativeDatabase;
  readonly NativeStatement: typeof NativeStatement;
  readonly NativeSession: typeof NativeSession;
  readonly defaultDatabaseDirectory: string | null;
  readonly bundledExtensions: never[];
  ensureDatabasePathExistsSync(databasePath: string): void;
  ensureDatabasePathExistsAsync(databasePath: string): Promise<void>;
  deleteDatabaseSync(databasePath: string): void;
  deleteDatabaseAsync(databasePath: string): Promise<void>;
  importAssetDatabaseAsync(databasePath: string, assetDatabasePath: string, forceOverwrite: boolean): Promise<void>;
  backupDatabaseSync(destination: NativeDatabase, destinationName: string, source: NativeDatabase, sourceName: string): void;
  backupDatabaseAsync(destination: NativeDatabase, destinationName: string, source: NativeDatabase, sourceName: string): Promise<void>;
}

/**
 * `ExpoSQLite`, what `expo-sqlite` asks: the native database, statement
 * and session classes over the runtime's SQLite library (the system's
 * SQLite, 3.29), the default directory (`SQLite` in the app's own local
 * data), the paths made and databases deleted, a bundled database
 * imported from an asset (a file copied, or a URL downloaded through the
 * file system library), a backup between two open databases, and
 * `onDatabaseChange` from the update hook of a database opened with the
 * change listener. The key-value store and the localStorage shim ride on
 * the same. No extension is bundled.
 */
export function createSQLiteModule(): ExpoSQLiteModule {
  const Base = nativeModuleClass();
  class Module extends Base<SQLiteEvents> implements ExpoSQLiteModule {
    readonly NativeDatabase = NativeDatabase;
    readonly NativeStatement = NativeStatement;
    readonly NativeSession = NativeSession;
    readonly bundledExtensions = [] as never[];
    private subscription: EmitterSubscription | null = null;

    get defaultDatabaseDirectory(): string | null {
      return native.sqlite()?.defaultDirectory() ?? null;
    }

    ensureDatabasePathExistsSync(databasePath: string): void {
      if (databasePath === ':memory:') return;
      unwrap(library().ensureDirectory(databasePath));
    }

    async ensureDatabasePathExistsAsync(databasePath: string): Promise<void> {
      this.ensureDatabasePathExistsSync(databasePath);
    }

    deleteDatabaseSync(databasePath: string): void {
      unwrap(library().deleteDatabase(databasePath));
    }

    async deleteDatabaseAsync(databasePath: string): Promise<void> {
      this.deleteDatabaseSync(databasePath);
    }

    async importAssetDatabaseAsync(databasePath: string, assetDatabasePath: string, forceOverwrite: boolean): Promise<void> {
      const sqlite = library();
      if (!forceOverwrite && sqlite.fileExists(databasePath)) return;
      const files = native.fileSystem();
      if (!files) throw new UnavailabilityError('SQLite', 'importAssetDatabaseAsync');
      unwrap(sqlite.ensureDirectory(databasePath));
      const destination = uriOf(databasePath);
      if (/^https?:/i.test(assetDatabasePath)) {
        await files.download(assetDatabasePath, destination, {}, `sqlite-${Date.now()}`);
      } else {
        unwrap(files.copy(uriOf(assetDatabasePath), destination, true));
      }
    }

    backupDatabaseSync(destination: NativeDatabase, destinationName: string, source: NativeDatabase, sourceName: string): void {
      unwrap(library().backup(destination.id, destinationName, source.id, sourceName));
    }

    async backupDatabaseAsync(destination: NativeDatabase, destinationName: string, source: NativeDatabase, sourceName: string): Promise<void> {
      this.backupDatabaseSync(destination, destinationName, source, sourceName);
    }

    startObserving(): void {
      this.subscription ??= DeviceEventEmitter.addListener('onDatabaseChange', (event: ChangeEvent) => {
        this.emit('onDatabaseChange', event);
      });
    }

    stopObserving(): void {
      this.subscription?.remove();
      this.subscription = null;
    }
  }
  return new Module();
}

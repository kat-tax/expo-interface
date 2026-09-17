/**
 * expo-sqlite over the runtime's C++ module and the system's SQLite: a
 * database in the app's local data with a table written and read, blobs
 * both ways, a transaction, the change listener, and the key-value store
 * on top — the route the Windows CI app and the harness carry to prove
 * them on screen.
 */
import {useEffect, useState} from 'react';
import {Body, Screen, Title} from 'expo-interface';
import * as SQLite from 'expo-sqlite';
import Storage from 'expo-sqlite/kv-store';

type Note = {id: number; text: string; size: number};

export default function DataRoute() {
  const [where, setWhere] = useState('…');
  const [written, setWritten] = useState('…');
  const [read, setRead] = useState('…');
  const [change, setChange] = useState('none yet');
  const [store, setStore] = useState('…');

  useEffect(() => {
    const listener = SQLite.addDatabaseChangeListener(event => setChange(`${event.databaseName} · ${event.tableName} row ${event.rowId}`));
    (async () => {
      setWhere(`${SQLite.defaultDatabaseDirectory ?? 'no directory'} · SQLite ${(await (await SQLite.openDatabaseAsync(':memory:')).getFirstAsync<{v: string}>('SELECT sqlite_version() AS v'))?.v}`);
      const database = await SQLite.openDatabaseAsync('probe.db', {enableChangeListener: true});
      await database.execAsync('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, text TEXT NOT NULL, bytes BLOB)');
      const result = await database.runAsync('INSERT INTO notes (text, bytes) VALUES (?, ?)', `written at ${new Date().toLocaleTimeString()}`, new Uint8Array([1, 2, 3, 4]));
      await database.withTransactionAsync(async () => {
        await database.runAsync('INSERT INTO notes (text, bytes) VALUES ($text, $bytes)', {$text: 'in a transaction', $bytes: new Uint8Array([5])});
      });
      setWritten(`#${result.lastInsertRowId} · ${result.changes} change · in transaction now ${await database.isInTransactionAsync()}`);
      const rows = await database.getAllAsync<Note>('SELECT id, text, length(bytes) AS size FROM notes ORDER BY id DESC LIMIT 2');
      const count = await database.getFirstAsync<{c: number}>('SELECT count(*) AS c FROM notes');
      const bytes = await database.getFirstAsync<{bytes: Uint8Array}>('SELECT bytes FROM notes ORDER BY id DESC LIMIT 1');
      setRead(`${count?.c} rows · newest "${rows[0]?.text}" ${rows[0]?.size} bytes, read back as ${bytes?.bytes instanceof Uint8Array ? `Uint8Array(${bytes.bytes.length})` : typeof bytes?.bytes}`);
      await Storage.setItem('probe', 'kept in the key-value store');
      setStore(`kv-store probe = ${await Storage.getItem('probe')} · keys ${(await Storage.getAllKeys()).length}`);
    })().catch(error => setRead(`✕ ${String(error.message ?? error)}`));
    return () => listener.remove();
  }, []);

  return (
    <Screen>
      <Title>Data</Title>
      <Body testID="where">{`Database ${where}`}</Body>
      <Body testID="written">{`Written ${written}`}</Body>
      <Body testID="read">{`Read ${read}`}</Body>
      <Body testID="change">{`Change ${change}`}</Body>
      <Body testID="store">{`Store ${store}`}</Body>
    </Screen>
  );
}

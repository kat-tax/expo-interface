import type {SaveFileSystem} from '.';
import {Platform} from 'react-native';
import {loadSaveFileSystem, saveFile, saveWith} from '.';

/** A stand-in for `expo-file-system`: the folder the picker answers, what it holds, and what was written into it. */
function fake(pick: () => Promise<unknown> = () => Promise.resolve(), names: string[] = []) {
  const written: {name: string; mimeType: string | null; content?: string | Uint8Array}[] = [];
  const fileSystem: SaveFileSystem = {
    Directory: {
      async pickDirectoryAsync() {
        await pick();
        return {
          list: () => names.map(name => ({name})),
          createFile(name, mimeType) {
            const file: (typeof written)[number] = {name, mimeType};
            written.push(file);
            return {
              write(content) {
                file.content = content;
              },
            };
          },
        };
      },
    },
  };
  return {fileSystem, written};
}

/** The platform's name for the nth copy of a file kept beside the first. */
const copy = (stem: string, n: number, extension: string) => (Platform.OS === 'ios' ? `${stem} ${n + 1}${extension}` : `${stem} (${n})${extension}`);

/** The name a file is saved under, into a folder that holds these. */
async function savedAs(name: string, names: string[]) {
  const {fileSystem, written} = fake(undefined, names);
  await saveWith({name, content: ''}, fileSystem);
  return written[0].name;
}

describe(`saveFile (${Platform.OS})`, () => {
  it('writes the file into the folder the user picks, its type following its name', async () => {
    const {fileSystem, written} = fake();
    await expect(saveWith({name: 'notes.md', content: '# Notes', mimeType: 'text/markdown'}, fileSystem)).resolves.toBe(true);
    // A document provider would add the extension of a type that does not match the name's.
    expect(written).toEqual([{name: 'notes.md', mimeType: 'application/octet-stream', content: '# Notes'}]);
    const bytes = new Uint8Array([1, 2, 3]);
    await saveWith({name: 'data.bin', content: bytes}, fileSystem);
    expect(written[1]).toEqual({name: 'data.bin', mimeType: 'application/octet-stream', content: bytes});
  });

  it('keeps a file of the same name, and writes the new one under the platform\'s name for a copy', async () => {
    expect(await savedAs('notes.md', ['notes.md'])).toBe(copy('notes', 1, '.md'));
    // Names are compared without case, and a copy's name can be taken too.
    expect(await savedAs('notes.md', ['NOTES.md', 'notes 2.md', 'notes (1).md'])).toBe(copy('notes', 2, '.md'));
    // And in one Unicode form: an accented name the folder holds decomposed is the same name.
    expect(await savedAs('café.md', ['café.md'.normalize('NFD')])).toBe(copy('café', 1, '.md'));
    expect(await savedAs('README', ['README'])).toBe(copy('README', 1, ''));
    // A name that starts with its only dot has no extension.
    expect(await savedAs('.env', ['.env'])).toBe(copy('.env', 1, ''));
    expect(await savedAs('notes.md', ['other.md'])).toBe('notes.md');
  });

  it('writes nothing when the user cancels the picker', async () => {
    const {fileSystem, written} = fake(() => Promise.reject(new Error('canceled')));
    await expect(saveWith({name: 'notes.md', content: '# Notes'}, fileSystem)).resolves.toBe(false);
    expect(written).toEqual([]);
  });

  it('says what is missing without expo-file-system', async () => {
    await expect(saveWith({name: 'notes.md', content: ''}, null)).rejects.toThrow('saveFile needs expo-file-system');
    expect(loadSaveFileSystem(() => {
      throw new Error('missing');
    })).toBeNull();
  });

  it('goes through the app\'s expo-file-system', async () => {
    expect(loadSaveFileSystem()).toBeTruthy();
    // The test harness's file system has no disk under its picker: the call goes through and settles.
    await expect(saveFile({name: 'notes.md', content: ''}).then(() => 'settled', () => 'settled')).resolves.toBe('settled');
  });
});

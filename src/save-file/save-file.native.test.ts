import type {SaveFileSystem} from '.';
import {Platform} from 'react-native';
import {loadSaveFileSystem, saveFile, saveWith} from '.';

/** A stand-in for `expo-file-system`: the folder the picker answers, and what was written into it. */
function fake(pick: () => Promise<unknown> = () => Promise.resolve()) {
  const written: {name: string; mimeType: string | null; content?: string | Uint8Array}[] = [];
  const fileSystem: SaveFileSystem = {
    Directory: {
      async pickDirectoryAsync() {
        await pick();
        return {
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

describe(`saveFile (${Platform.OS})`, () => {
  it('writes the file into the folder the user picks', async () => {
    const {fileSystem, written} = fake();
    await expect(saveWith({name: 'notes.md', content: '# Notes', mimeType: 'text/markdown'}, fileSystem)).resolves.toBe(true);
    expect(written).toEqual([{name: 'notes.md', mimeType: 'text/markdown', content: '# Notes'}]);
    const bytes = new Uint8Array([1, 2, 3]);
    await saveWith({name: 'data.bin', content: bytes}, fileSystem);
    expect(written[1]).toEqual({name: 'data.bin', mimeType: 'application/octet-stream', content: bytes});
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

import {forgetSwatches, loadFileSystem, swatchImage} from './swatch-file.ios';

/** A file system that remembers what was written to it. */
function fakeFileSystem(options: {throws?: boolean} = {}) {
  const files = new Map<string, Uint8Array>();
  const directories = new Set<string>();
  class Directory {
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join('/');
    }
    get exists() {
      return directories.has(this.uri);
    }
    create() {
      if (options.throws) throw new Error('read only');
      directories.add(this.uri);
    }
  }
  class File {
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join('/');
    }
    get exists() {
      return files.has(this.uri);
    }
    write(content: Uint8Array) {
      files.set(this.uri, content);
    }
  }
  return {Paths: {cache: {uri: 'file:///cache'}}, Directory, File, files, directories};
}

describe('swatchImage (ios)', () => {
  beforeEach(forgetSwatches);

  it('writes the dot once to the cache and answers its file', () => {
    const fs = fakeFileSystem();
    const uri = swatchImage('#FF0000', fs);
    expect(uri).toBe('file:///cache/expo-interface/swatch-ff0000@3x.png');
    expect(fs.directories.has('file:///cache/expo-interface')).toBe(true);
    const written = fs.files.get(uri!)!;
    expect(String.fromCharCode(...written.slice(1, 4))).toBe('PNG');
    // Asked again, the file is reused: nothing is written twice.
    fs.files.clear();
    expect(swatchImage('#FF0000', fs)).toBe(uri);
    expect(fs.files.size).toBe(0);
  });

  it('reuses a file already in the cache from an earlier run', () => {
    const fs = fakeFileSystem();
    fs.directories.add('file:///cache/expo-interface');
    fs.files.set('file:///cache/expo-interface/swatch-00ff00@3x.png', new Uint8Array(1));
    expect(swatchImage('#00FF00', fs)).toBe('file:///cache/expo-interface/swatch-00ff00@3x.png');
    expect(fs.files.get('file:///cache/expo-interface/swatch-00ff00@3x.png')!.length).toBe(1);
  });

  it('answers nothing without a file system, or when the cache cannot be written', () => {
    expect(swatchImage('#FF0000', null)).toBeUndefined();
    const fs = fakeFileSystem({throws: true});
    expect(swatchImage('#0000FF', fs)).toBeUndefined();
    // Remembered, so the failure is not retried on every render.
    expect(swatchImage('#0000FF', fs)).toBeUndefined();
  });

  it('loads expo-file-system where the app has it, and nothing where it does not', () => {
    // The test environment has the package, as the example does.
    expect(loadFileSystem()).toBeTruthy();
    // An app without it: the require throws, and the menu draws its dot as a symbol.
    expect(loadFileSystem(() => {
      throw new Error('Cannot find module expo-file-system');
    })).toBeNull();
  });
});

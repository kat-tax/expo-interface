import {swatchFileName, swatchPng} from './swatch';

/** The parts of `expo-file-system` the dot is written with. */
interface FileSystem {
  Paths: {cache: {uri: string}};
  Directory: new (...uris: string[]) => {exists: boolean; create(options?: {idempotent?: boolean; intermediates?: boolean}): void};
  File: new (...uris: string[]) => {exists: boolean; uri: string; write(content: Uint8Array): void};
}

/**
 * `expo-file-system`, when the app has it: the `require` sits in a `try` so
 * Metro treats the dependency as optional and a bundle without the library
 * still builds. Without it the menu draws its dot as a symbol instead.
 */
export function loadFileSystem(load: () => FileSystem = requireFileSystem): FileSystem | null {
  try {
    return load();
  } catch {
    return null;
  }
}

function requireFileSystem(): FileSystem {
  // eslint-disable-next-line typescript/no-require-imports -- optional peer, resolved only when installed.
  return require('expo-file-system') as FileSystem;
}

const written = new Map<string, string | undefined>();

/**
 * iOS: the file URI of a PNG dot in the color, written to the cache
 * directory the first time a color is asked for and reused after, so a
 * SwiftUI `Menu` can draw it as an image that keeps its color. `undefined`
 * without `expo-file-system`, or when the cache cannot be written, and the
 * caller draws a symbol instead.
 */
export function swatchImage(hex: string, fileSystem: FileSystem | null = loadFileSystem()): string | undefined {
  const name = swatchFileName(hex);
  if (written.has(name)) return written.get(name);
  let uri: string | undefined;
  try {
    if (fileSystem) {
      const directory = new fileSystem.Directory(fileSystem.Paths.cache.uri, 'expo-interface');
      if (!directory.exists) directory.create({idempotent: true, intermediates: true});
      const file = new fileSystem.File(fileSystem.Paths.cache.uri, 'expo-interface', name);
      if (!file.exists) file.write(swatchPng(hex));
      uri = file.uri;
    }
  } catch {
    // A cache that cannot be written is no reason to drop the menu: the dot is a symbol then.
    uri = undefined;
  }
  written.set(name, uri);
  return uri;
}

/** @internal forgets the files written, for tests. */
export function forgetSwatches(): void {
  written.clear();
}

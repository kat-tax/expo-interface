import type {SaveFileOptions} from './types';
import {Platform} from 'react-native';

/** A folder the user picked: what is in it, and a file made in it. */
interface SaveFolder {
  list(): {name: string}[];
  createFile(name: string, mimeType: string | null): {write(content: string | Uint8Array): void};
}

/** The parts of `expo-file-system` a file is saved with. */
export interface SaveFileSystem {
  Directory: {pickDirectoryAsync(initialUri?: string): Promise<SaveFolder>};
}

/**
 * `expo-file-system`, when the app has it (an optional peer), or the file
 * system a test hands in. The `require` sits in the `try` itself, which is
 * what makes Metro treat it as optional: a bundle without the package still
 * builds.
 */
export function loadSaveFileSystem(load?: () => SaveFileSystem): SaveFileSystem | null {
  try {
    // eslint-disable-next-line typescript/no-require-imports -- optional peer, resolved only when installed.
    return load ? load() : (require('expo-file-system') as SaveFileSystem);
  } catch {
    return null;
  }
}

/**
 * A name as the folder's names are compared: without case and in one Unicode
 * form, so that no spelling the folder takes for the same file slips past.
 * Windows and Android's shared storage fold case, as can a provider in the
 * iOS Files app, and APFS takes either form of an accented name as one.
 */
function sameName(name: string): string {
  return name.normalize('NFC').toLowerCase();
}

/**
 * The name to write under in a folder that may hold it already: the name
 * itself, or the platform's name for a copy kept beside the first, `notes 2.md`
 * on iOS (as the Files app keeps both) and `notes (1).md` on Android and
 * Windows (as the Storage Access Framework and the browsers name one).
 */
function freeName(name: string, taken: ReadonlySet<string>): string {
  if (!taken.has(sameName(name))) return name;
  const dot = name.lastIndexOf('.');
  const [stem, extension] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
  for (let copy = 1; ; copy += 1) {
    const candidate = Platform.OS === 'ios' ? `${stem} ${copy + 1}${extension}` : `${stem} (${copy})${extension}`;
    if (!taken.has(sameName(candidate))) return candidate;
  }
}

/**
 * Saves through a file system, if there is one: the folder the user picks,
 * the file written into it under its name, or under the platform's name for
 * a copy when the folder holds that name already.
 */
export async function saveWith({name, content}: SaveFileOptions, fileSystem: SaveFileSystem | null): Promise<boolean> {
  if (!fileSystem) throw new Error('saveFile needs expo-file-system, which this app does not have.');
  let folder;
  try {
    folder = await fileSystem.Directory.pickDirectoryAsync();
  } catch {
    // The picker was dismissed.
    return false;
  }
  const taken = new Set(folder.list().map(entry => sameName(entry.name)));
  // The type follows the name: a document provider adds the extension of a
  // type that does not match the name's own.
  folder.createFile(freeName(name, taken), 'application/octet-stream').write(content);
  return true;
}

/**
 * Saves a file where the user chooses: an export, a backup, a download of
 * what the app made. iOS, Android and Windows open the system's folder
 * picker (`UIDocumentPickerViewController`, the Storage Access Framework,
 * the shell's picker) through `expo-file-system`, an optional peer, which
 * has no save picker: the user picks the folder, and the file takes the
 * name it is given. On Android the system first asks the user to let the
 * app into the folder, and from Android 11 Download itself cannot be
 * picked, only a folder in it. A file of that name in the folder is kept,
 * and the new one takes the platform's name for a copy: `notes 2.md` on
 * iOS, `notes (1).md` on Android and Windows. Resolves `true` once written
 * and `false` when the user cancels; a failure to write rejects.
 *
 * The web opens the browser's save picker where it has one (the Chromium
 * browsers), where the user picks the folder and the name, and downloads
 * the file everywhere else, as it does when the picker will not open
 * because the press that started the save is too long ago. There `false`
 * means only that the user dismissed the picker, and a download resolves
 * `true` once it starts: the browser does not say whether the file was kept.
 */
export function saveFile(options: SaveFileOptions): Promise<boolean> {
  return saveWith(options, loadSaveFileSystem());
}

export type {SaveFileOptions} from './types';

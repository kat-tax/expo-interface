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
 * The name to write under in a folder that may hold it already: the name
 * itself, or the platform's name for a copy kept beside the first, `notes 2.md`
 * on iOS (as the Files app keeps both) and `notes (1).md` on Android and
 * Windows (as the Storage Access Framework and the browsers name one). The
 * names are compared without case, as the file systems there compare them.
 */
function freeName(name: string, taken: ReadonlySet<string>): string {
  if (!taken.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf('.');
  const [stem, extension] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
  for (let copy = 1; ; copy += 1) {
    const candidate = Platform.OS === 'ios' ? `${stem} ${copy + 1}${extension}` : `${stem} (${copy})${extension}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
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
  const taken = new Set(folder.list().map(entry => entry.name.toLowerCase()));
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
 * app's name. A file of that name in the folder is kept, and the new one
 * takes the platform's name for a copy: `notes 2.md` on iOS, `notes (1).md`
 * on Android and Windows. Resolves `true` once written and `false` when the
 * user cancels; a failure to write rejects.
 */
export function saveFile(options: SaveFileOptions): Promise<boolean> {
  return saveWith(options, loadSaveFileSystem());
}

export type {SaveFileOptions} from './types';

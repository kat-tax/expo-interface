import type {SaveFileOptions} from './types';

/** The parts of `expo-file-system` a file is saved with. */
export interface SaveFileSystem {
  Directory: {pickDirectoryAsync(initialUri?: string): Promise<{createFile(name: string, mimeType: string | null): {write(content: string | Uint8Array): void}}>};
}

/**
 * `expo-file-system`, when the app has it (an optional peer): the `require`
 * sits in a `try` so Metro treats the dependency as optional and a bundle
 * without it still builds.
 */
export function loadSaveFileSystem(load: () => SaveFileSystem = requireFileSystem): SaveFileSystem | null {
  try {
    return load();
  } catch {
    return null;
  }
}

function requireFileSystem(): SaveFileSystem {
  // eslint-disable-next-line typescript/no-require-imports -- optional peer, resolved only when installed.
  return require('expo-file-system') as SaveFileSystem;
}

/** Saves through a file system, if there is one: the folder the user picks, the file written into it. */
export async function saveWith({name, content, mimeType = 'application/octet-stream'}: SaveFileOptions, fileSystem: SaveFileSystem | null): Promise<boolean> {
  if (!fileSystem) throw new Error('saveFile needs expo-file-system, which this app does not have.');
  let folder;
  try {
    folder = await fileSystem.Directory.pickDirectoryAsync();
  } catch {
    // The picker was dismissed.
    return false;
  }
  folder.createFile(name, mimeType).write(content);
  return true;
}

/**
 * Saves a file where the user chooses: an export, a backup, a download of
 * what the app made. iOS, Android and Windows open the system's folder
 * picker (`UIDocumentPickerViewController`, the Storage Access Framework,
 * the shell's picker) through `expo-file-system`, an optional peer, and
 * write the file into the folder chosen. Resolves `true` once written and
 * `false` when the user cancels; a failure to write rejects.
 */
export function saveFile(options: SaveFileOptions): Promise<boolean> {
  return saveWith(options, loadSaveFileSystem());
}

export type {SaveFileOptions} from './types';

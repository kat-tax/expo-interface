import type {SaveFileOptions} from './types';

/** The File System Access API's save picker, where the browser has one. */
interface SavePickerWindow {
  showSaveFilePicker?: (options: {suggestedName: string}) => Promise<{createWritable(): Promise<{write(data: Blob): Promise<void>; close(): Promise<void>}>}>;
}

/**
 * Web: the browser's save picker where it has one (`showSaveFilePicker`,
 * in the Chromium browsers), so the user chooses the folder and the name;
 * a download everywhere else, saved where the browser saves them.
 * Resolves `true` once saved and `false` when the user cancels the picker.
 */
export async function saveFile({name, content, mimeType = 'application/octet-stream'}: SaveFileOptions): Promise<boolean> {
  // A typed array is copied out, so the blob holds the bytes even if the caller's buffer changes.
  const blob = new Blob([typeof content === 'string' ? content : new Uint8Array(content)], {type: mimeType});
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (picker) {
    let handle;
    try {
      handle = await picker({suggestedName: name});
    } catch {
      // The picker was dismissed.
      return false;
    }
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked once the click has handed the URL to the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

export type {SaveFileOptions} from './types';

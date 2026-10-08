import type {SaveFileOptions} from './types';

/** The File System Access API's save picker, where the browser has one. */
interface SavePickerWindow {
  showSaveFilePicker?: (options: {suggestedName: string}) => Promise<{createWritable(): Promise<{write(data: Blob): Promise<void>; close(): Promise<void>}>}>;
}

/** A download of the blob under the name, saved where the browser saves them. */
function download(blob: Blob, name: string): true {
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

/**
 * Web: the browser's save picker where it has one (`showSaveFilePicker`,
 * in the Chromium browsers), so the user chooses the folder and the name;
 * a download everywhere else, saved where the browser saves them. The
 * picker opens only while the press that asked for it is recent, which an
 * export that awaits its content first can outlast: when it will not open,
 * the file downloads instead. Resolves `true` once saved and `false` when
 * the user dismisses the picker; a failure to write rejects.
 */
export async function saveFile({name, content, mimeType = 'application/octet-stream'}: SaveFileOptions): Promise<boolean> {
  // A typed array is copied out, so the blob holds the bytes even if the caller's buffer changes.
  const blob = new Blob([typeof content === 'string' ? content : new Uint8Array(content)], {type: mimeType});
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (!picker) return download(blob, name);
  let handle;
  try {
    handle = await picker({suggestedName: name});
  } catch (error) {
    // The user dismissed the picker.
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    // The picker would not open: it needs the press that asked for it to be
    // recent (a `SecurityError` once that lapses), and a page may not open it
    // at all, as in a frame from another origin.
    return download(blob, name);
  }
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

export type {SaveFileOptions} from './types';

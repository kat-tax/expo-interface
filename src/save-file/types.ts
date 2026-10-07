/** A file to save where the user chooses (see `saveFile`). */
export interface SaveFileOptions {
  /** The file's name, with its extension: `notes.md`. */
  name: string;
  /** What goes in it: text, or bytes. */
  content: string | Uint8Array;
  /**
   * The media type, for the file's record and the browser's download.
   * @default 'application/octet-stream'
   */
  mimeType?: string;
}

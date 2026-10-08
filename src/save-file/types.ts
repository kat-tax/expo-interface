/** A file to save where the user chooses (see `saveFile`). */
export interface SaveFileOptions {
  /**
   * The file's name, with its extension: `notes.md`. On iOS, Android and
   * Windows a folder that holds the name already keeps its file, and this
   * one takes the platform's name for a copy (see `saveFile`).
   */
  name: string;
  /** What goes in it: text, or bytes. */
  content: string | Uint8Array;
  /**
   * The media type of the file the web saves. iOS, Android and Windows go
   * by the name's extension.
   * @default 'application/octet-stream'
   */
  mimeType?: string;
}

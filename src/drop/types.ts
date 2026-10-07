import type {PropsWithChildren} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/** A file dropped on the app, as the browser hands it over. */
export interface DroppedFile {
  name: string;
  /** The media type the browser reports, or an empty string. */
  type: string;
  /** The size in bytes. */
  size: number;
  /** The browser's `File`, to read with `text()`, `arrayBuffer()` or a `FileReader`. */
  file: File;
}

/** What a drop target is told (see `useDrop`). */
export interface DropOptions {
  /** Called with the files dropped. */
  onDrop: (files: DroppedFile[]) => void;
  /** Takes no drops while set. */
  disabled?: boolean;
}

/** A view that takes files dropped on it (see `DropZone`). */
export interface DropZoneProps extends PropsWithChildren, DropOptions {
  /**
   * What the overlay says while files are held over the zone.
   * @default 'Drop files here'
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

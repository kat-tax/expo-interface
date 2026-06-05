import type {StyleProp, ViewStyle} from 'react-native';

/**
 * Which components the picker edits.
 * - `date` selects a calendar day.
 * - `time` selects an hour and minute.
 * - `datetime` selects both.
 */
export type DateTimeMode = 'date' | 'time' | 'datetime';

/**
 * Cross-platform date/time picker with a conformed iOS-style appearance.
 *
 * The control may be used controlled (pass `value` + `onChange`) or
 * uncontrolled (omit both and it manages its own state).
 */
export interface DateTimePickerProps {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** Current value (controlled). When omitted the component keeps its own state. */
  value?: Date;
  /** Called whenever the user commits a new date/time. */
  onChange?: (date: Date) => void;
  /**
   * Which components to edit.
   * @default 'datetime'
   */
  mode?: DateTimeMode;
  /** Earliest selectable date. */
  minimumDate?: Date;
  /** Latest selectable date. */
  maximumDate?: Date;
  /** Disables interaction. */
  disabled?: boolean;
  /** Tint applied to the value text (web/android) and the native picker (iOS). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web/android only). */
  style?: StyleProp<ViewStyle>;
}

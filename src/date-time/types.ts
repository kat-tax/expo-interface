import type {StyleProp, ViewStyle} from 'react-native';

/**
 * Which components the picker edits.
 * - `date` selects a calendar day.
 * - `time` selects an hour and minute.
 * - `datetime` selects both.
 */
export type DateTimeMode = 'date' | 'time' | 'datetime';

/**
 * A value the picker takes: a `Date`, or a calendar day written `YYYY-MM-DD`,
 * which is a day in no time zone (a due date, a birthday) and reads the same
 * wherever the app runs.
 */
export type DateTimeValue = Date | string;

/** A rectangle in the coordinates of the content a presented picker is laid over: the chip that opens it. */
export interface DateTimeAnchor {
  x: number;
  y: number;
  /** @default 0 */
  width?: number;
  /** @default 0 */
  height?: number;
}

/**
 * Cross-platform date/time picker with a conformed iOS-style appearance.
 *
 * The control may be used controlled (pass `value` + `onChange`) or
 * uncontrolled (omit both and it manages its own state).
 *
 * With `presented` it draws no row: it presents the platform's own picker
 * over the content, from `at`, for a date chip on a canvas the kit did not
 * draw.
 */
export interface DateTimePickerProps {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** Current value (controlled): a `Date`, or a day as `YYYY-MM-DD`. When omitted the component keeps its own state. */
  value?: DateTimeValue;
  /**
   * Called whenever the user commits a new date/time, with the value and the
   * local calendar day it falls on as `YYYY-MM-DD`, which is what a value
   * given as a day wants back.
   */
  onChange?: (date: Date, day: string) => void;
  /**
   * Which components to edit.
   * @default 'datetime'
   */
  mode?: DateTimeMode;
  /** Earliest selectable date. */
  minimumDate?: DateTimeValue;
  /** Latest selectable date. */
  maximumDate?: DateTimeValue;
  /** Disables interaction. */
  disabled?: boolean;
  /** Tint applied to the value text (web/android) and the native picker (iOS). */
  accentColor?: string;
  /**
   * Presents the platform's own picker over the content instead of drawing a
   * row: a popover with the calendar on iOS, the Material dialogs on Android
   * (the date, then the time for `datetime`), the browser's picker on web, a
   * flyout with the calendar or the time on Windows. `false` keeps it closed;
   * leave it out for the row.
   */
  presented?: boolean;
  /**
   * Where a presented picker opens from, in the coordinates of the parent it
   * is laid over: the chip's rectangle. Android's dialogs open in the middle
   * of the screen whatever it says.
   */
  at?: DateTimeAnchor | null;
  /**
   * Called when a presented picker closes, picked or not, after `onChange`
   * when something was picked. In `date` mode a pick closes it.
   */
  onDismiss?: () => void;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web and Windows). */
  style?: StyleProp<ViewStyle>;
}

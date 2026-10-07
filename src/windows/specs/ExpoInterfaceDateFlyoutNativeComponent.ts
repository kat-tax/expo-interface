import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type DateEvent = Readonly<{date: string}>;
type TimeEvent = Readonly<{time: string}>;
type OpenEvent = Readonly<{open: boolean}>;

/**
 * The presented date picker: a WinUI 3 `CalendarView` in a `Flyout` for a
 * day, a `TimePickerFlyout` for a time, shown from a one-point island at the
 * parent's origin, at `x`/`y` in the parent's coordinates. The island is a
 * point rather than laid over the chip: an island takes the pointer for
 * itself, whatever React Native's hit testing says.
 *
 * Dates cross as local `YYYY-MM-DD` strings and times as `HH:MM`. A pick is
 * reported and the flyout stays open; the kit closes it through `open`. A
 * new `mode` while it is open swaps the calendar for the time, or back,
 * with no close reported. A light dismiss reports `onOpenChange(false)`.
 */
export interface NativeProps extends ViewProps {
  open: boolean;
  /** `date` shows the calendar, `time` the time flyout. */
  mode?: CodegenTypes.WithDefault<'date' | 'time', 'date'>;
  /** `YYYY-MM-DD`: the selected day. */
  date?: string;
  /** `HH:MM`: the selected time. */
  time?: string;
  /** `YYYY-MM-DD`; empty for no bound. */
  minDate?: string;
  /** `YYYY-MM-DD`; empty for no bound. */
  maxDate?: string;
  x?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  y?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onDateChange?: CodegenTypes.DirectEventHandler<DateEvent>;
  onTimeChange?: CodegenTypes.DirectEventHandler<TimeEvent>;
  onOpenChange?: CodegenTypes.DirectEventHandler<OpenEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceDateFlyout');

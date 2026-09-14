import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type DateEvent = Readonly<{date: string}>;

/**
 * A WinUI 3 `CalendarDatePicker` hosted in a XAML island: a field showing
 * the date that opens a calendar flyout. Dates cross the boundary as local
 * `YYYY-MM-DD` strings; an empty `date` shows the placeholder.
 */
export interface NativeProps extends ViewProps {
  /** `YYYY-MM-DD`, or empty for no date. */
  date?: string;
  /** `YYYY-MM-DD`; empty for no bound. */
  minDate?: string;
  /** `YYYY-MM-DD`; empty for no bound. */
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onDateChange?: CodegenTypes.DirectEventHandler<DateEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceDatePicker');

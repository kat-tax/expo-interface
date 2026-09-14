import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type TimeEvent = Readonly<{time: string}>;

/**
 * A WinUI 3 `TimePicker` hosted in a XAML island. Times cross the boundary
 * as `HH:MM` (24-hour) strings; the control shows them in the system's clock.
 */
export interface NativeProps extends ViewProps {
  /** `HH:MM`, 24-hour. */
  time: string;
  disabled?: boolean;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onTimeChange?: CodegenTypes.DirectEventHandler<TimeEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceTimePicker');

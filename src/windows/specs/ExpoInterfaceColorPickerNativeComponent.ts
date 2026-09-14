import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ValueEvent = Readonly<{value: string}>;

/**
 * A color well — a WinUI 3 `Button` showing the color — that opens a
 * `Flyout` holding the WinUI 3 `ColorPicker`, hosted in a XAML island. The
 * value crosses as `#RRGGBBAA`; `alpha` shows the opacity channel.
 */
export interface NativeProps extends ViewProps {
  /** `#RRGGBB` or `#RRGGBBAA`. */
  value: string;
  alpha?: boolean;
  disabled?: boolean;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  /** Reports `#RRGGBBAA` as the user picks. */
  onValueChange?: CodegenTypes.DirectEventHandler<ValueEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceColorPicker');

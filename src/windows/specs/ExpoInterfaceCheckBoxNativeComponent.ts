import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ValueEvent = Readonly<{value: boolean}>;

/**
 * A WinUI 3 `CheckBox` hosted in a XAML island, without content: the kit
 * draws the row's label at the leading edge and the box sits at the trailing
 * one, mirroring the iOS form row the other platforms draw.
 */
export interface NativeProps extends ViewProps {
  value: boolean;
  disabled?: boolean;
  /** Fill of the checked box (`#RRGGBB`); defaults to `accentColor`. */
  color?: string;
  /** Accessible name of the box. */
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onValueChange?: CodegenTypes.DirectEventHandler<ValueEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceCheckBox');

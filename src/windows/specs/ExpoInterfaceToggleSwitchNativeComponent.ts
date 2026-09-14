import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ValueEvent = Readonly<{value: boolean}>;

/**
 * A WinUI 3 `ToggleSwitch` hosted in a XAML island, without its header or
 * on/off text: the kit draws the row's label itself, so the control is the
 * toggle alone at the trailing edge, as on every other platform.
 */
export interface NativeProps extends ViewProps {
  value: boolean;
  disabled?: boolean;
  /** Fill of the on state (`#RRGGBB`); defaults to `accentColor`. */
  color?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onValueChange?: CodegenTypes.DirectEventHandler<ValueEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceToggleSwitch');

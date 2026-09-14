import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ValueEvent = Readonly<{value: CodegenTypes.Double}>;

/**
 * A WinUI 3 `Slider` hosted in a XAML island. `step` of `0` is continuous:
 * the control steps by a thousandth of the range so a drag reads smoothly.
 */
export interface NativeProps extends ViewProps {
  value: CodegenTypes.Double;
  min?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  max?: CodegenTypes.WithDefault<CodegenTypes.Double, 1>;
  step?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  disabled?: boolean;
  /** Color of the thumb and filled track (`#RRGGBB`); defaults to `accentColor`. */
  color?: string;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  /** Fires while the thumb moves. */
  onValueChange?: CodegenTypes.DirectEventHandler<ValueEvent>;
  /** Fires once when the thumb is released (pointer up or key up). */
  onSlidingComplete?: CodegenTypes.DirectEventHandler<ValueEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceSlider');

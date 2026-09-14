import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ValueEvent = Readonly<{value: CodegenTypes.Double}>;

/**
 * A WinUI 3 `NumberBox` with inline spin buttons hosted in a XAML island:
 * the Fluent stepper. `hasMin` / `hasMax` say whether the bounds apply,
 * since a prop cannot be absent on the native side.
 */
export interface NativeProps extends ViewProps {
  value: CodegenTypes.Double;
  step?: CodegenTypes.WithDefault<CodegenTypes.Double, 1>;
  hasMin?: boolean;
  min?: CodegenTypes.Double;
  hasMax?: boolean;
  max?: CodegenTypes.Double;
  disabled?: boolean;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onValueChange?: CodegenTypes.DirectEventHandler<ValueEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceNumberBox');

import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectionEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `ComboBox` hosted in a XAML island. `options` is a JSON array of
 * the option labels; the selection is reported by index, so a kit value of
 * any type maps back on the JavaScript side.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of option labels. */
  options: string;
  selectedIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, -1>;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceComboBox');

import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectionEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `SelectorBar` hosted in a XAML island: Fluent's segmented
 * control, a row of items with an underline on the selected one. `options`
 * is a JSON array of the segment labels.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of segment labels. */
  options: string;
  selectedIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
  disabled?: boolean;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceSelectorBar');

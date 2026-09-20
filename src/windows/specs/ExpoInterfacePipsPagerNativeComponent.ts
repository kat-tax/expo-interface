import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectionEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `PipsPager` hosted in a XAML island: Fluent's page indicator.
 *
 * The one control in a pager that can be the platform's own, because it has
 * no children to host — it is a count, a selected index, and the chevrons the
 * system shows when a pointer is over it, which is a desktop affordance the
 * touch platforms have no equivalent of.
 */
export interface NativeProps extends ViewProps {
  /** How many pages there are. */
  count: CodegenTypes.Int32;
  selectedIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
  /** What the indicator is called; the control numbers the pips itself. */
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfacePipsPager');

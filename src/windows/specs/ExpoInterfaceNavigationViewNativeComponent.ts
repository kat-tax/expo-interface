import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectionEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `NavigationView` in its top mode, hosted in a XAML island: the
 * Windows tab bar. `items` is a JSON array of `{label, glyph}`; the
 * selection is reported by index. The content under it is React Native's:
 * the kit renders the focused tab's screens itself.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of the tabs. */
  items: string;
  selectedIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
  /** Text in the bar's leading slot: the app's name. */
  header?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceNavigationView');

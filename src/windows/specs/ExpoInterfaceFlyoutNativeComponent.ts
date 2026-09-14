import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ActionEvent = Readonly<{index: CodegenTypes.Int32}>;
type OpenEvent = Readonly<{open: boolean}>;

/**
 * A WinUI 3 `Flyout` holding a title, a message and a row of buttons, shown
 * from a XAML island the kit lays over the rectangle it points at: the
 * Windows popover. Placed below the island, or above it when there is no
 * room.
 *
 * `actions` is a JSON array of `{label, role}`; a press is reported by
 * index and closes the flyout. Light dismiss reports `onOpenChange(false)`.
 */
export interface NativeProps extends ViewProps {
  open: boolean;
  title?: string;
  message?: string;
  /** JSON array of the actions. */
  actions: string;
  /** Width of the flyout's content in points. */
  width?: CodegenTypes.WithDefault<CodegenTypes.Double, 280>;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onAction?: CodegenTypes.DirectEventHandler<ActionEvent>;
  onOpenChange?: CodegenTypes.DirectEventHandler<OpenEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceFlyout');

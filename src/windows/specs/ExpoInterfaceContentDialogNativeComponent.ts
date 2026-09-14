import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ActionEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `ContentDialog` presented from a XAML island: the Windows alert.
 * The island is a zero-size anchor; the dialog is modal over the window.
 *
 * `actions` is a JSON array of `{label, role}`. Up to three actions take the
 * dialog's own buttons (the `cancel` one closes it, the others are the
 * primary and secondary buttons); more than that are stacked in the body.
 * A pick is reported by index; closing any other way reports `-1`.
 */
export interface NativeProps extends ViewProps {
  open: boolean;
  title: string;
  message?: string;
  /** JSON array of the actions. */
  actions: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onClose?: CodegenTypes.DirectEventHandler<ActionEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceContentDialog');

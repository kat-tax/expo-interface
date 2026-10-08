import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ActionEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `ContentDialog` presented from a XAML island: the Windows alert.
 * The island is a zero-size anchor; the dialog is modal over the window.
 *
 * `actions` is a JSON array of `{label, role, disabled}`. Up to three
 * actions take the dialog's own buttons (the `cancel` one closes it, the
 * others are the primary and secondary buttons); more than that are stacked
 * in the body. A disabled action's button takes no press. While the dialog
 * is open a change to `actions` updates each button's label and whether it
 * takes presses; the buttons are arranged as it opens. A pick is reported by
 * index; any other close reports the cancel's (`-1` without one).
 */
export interface NativeProps extends ViewProps {
  open: boolean;
  title: string;
  message?: string;
  /** JSON array of the actions. */
  actions: string;
  /** Names a content slot in the body an `ExpoInterfacePortal` fills with React Native content. */
  slot?: string;
  /** Whether a press on the smoke closes the dialog as the cancel action. */
  lightDismiss?: boolean;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onClose?: CodegenTypes.DirectEventHandler<ActionEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceContentDialog');

import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type TextEvent = Readonly<{text: string}>;
type KeyEvent = Readonly<{key: string; shiftKey: boolean}>;

/**
 * A WinUI 3 `TextBox` (or `PasswordBox` with `password`) hosted in a XAML
 * island. `borderless` strips the control's chrome for a form row, where the
 * section around it draws the box; `inline` keeps it for a field on its own.
 */
export interface NativeProps extends ViewProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  password?: boolean;
  multiline?: boolean;
  maxLength?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
  /** The on-screen keyboard's layout on a touch device. */
  inputScope?: CodegenTypes.WithDefault<'default' | 'email' | 'number' | 'phone' | 'decimal' | 'url', 'default'>;
  spellCheck?: boolean;
  autoFocus?: boolean;
  /** No chrome: the control is the text alone, for a row in a section. */
  borderless?: boolean;
  label?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onChangeText?: CodegenTypes.DirectEventHandler<TextEvent>;
  /** Enter in a single-line field. */
  onSubmit?: CodegenTypes.DirectEventHandler<TextEvent>;
  onKeyPress?: CodegenTypes.BubblingEventHandler<KeyEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceTextBox');

import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A WinUI 3 `InfoBar` hosted in a XAML island: the Windows toast, a strip
 * with a message, an optional action button and a close button. The kit
 * places it over the bottom of the screen and times it.
 */
export interface NativeProps extends ViewProps {
  message: string;
  /** Text of the action button; none without it. */
  actionLabel?: string;
  /** Whether the close button is shown. */
  closable?: boolean;
  severity?: CodegenTypes.WithDefault<'informational' | 'success' | 'warning' | 'error', 'informational'>;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onAction?: CodegenTypes.DirectEventHandler<Readonly<{}>>;
  onClose?: CodegenTypes.DirectEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceInfoBar');

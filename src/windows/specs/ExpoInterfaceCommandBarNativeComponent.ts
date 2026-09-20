import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type PressEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `CommandBar` hosted in a XAML island: the platform's own toolbar.
 *
 * The commands cross as JSON rather than as children because that is what the
 * control wants — it builds its own `AppBarButton`s, decides which of them fit
 * the width it is given, and moves the rest into an overflow menu it draws
 * itself. None of that is possible for a bar handed React children.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of `{label, glyph, secondary, disabled, role, separator}`. */
  commands: string;
  /**
   * Where a command's label sits against its icon. `collapsed` leaves the
   * labels to the overflow menu, which is what a dense bar of tools wants.
   */
  labels?: CodegenTypes.WithDefault<'right' | 'bottom' | 'collapsed', 'bottom'>;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onPress?: CodegenTypes.DirectEventHandler<PressEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceCommandBar');

import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

/**
 * A press, naming the command by its index in `commands`. `item` is the
 * entry picked from a menu command's flyout, by its index in the command's
 * `menu`; -1 for a press of the command itself.
 */
type PressEvent = Readonly<{index: CodegenTypes.Int32; item: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `CommandBar` hosted in a XAML island: the platform's own toolbar.
 *
 * The commands cross as JSON rather than as children because that is what the
 * control wants — it builds its own `AppBarButton`s, decides which of them fit
 * the width it is given, and moves the rest into an overflow menu it draws
 * itself. None of that is possible for a bar handed React children.
 */
export interface NativeProps extends ViewProps {
  /**
   * JSON array of `{label, glyph, secondary, disabled, role, separator,
   * toggle, checked, menu?}`. `toggle` makes the command an
   * `AppBarToggleButton`, on while `checked`; `menu` is the entries of a
   * menu command, in the shape the menu island takes (`menuEntries` in
   * `src/menu/windows.ts`), opened as the button's `MenuFlyout`.
   */
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

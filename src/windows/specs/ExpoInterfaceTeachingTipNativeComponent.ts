import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ActionEvent = Readonly<{index: CodegenTypes.Int32}>;
type OpenEvent = Readonly<{open: boolean}>;

/**
 * A WinUI 3 `TeachingTip` holding a title, a message and a row of buttons,
 * pointing at a XAML island the kit lays over the rectangle it is about: the
 * Windows popover.
 *
 * A `TeachingTip` rather than a `Flyout` because it is the control this
 * component describes — it has a tail that points at its target, which a
 * flyout does not, and it takes the title and the message as its own
 * properties rather than as text blocks built by hand.
 *
 * `actions` is a JSON array of `{label, role}`; a press is reported by
 * index and closes the tip. Light dismiss reports `onOpenChange(false)`.
 */
export interface NativeProps extends ViewProps {
  open: boolean;
  title?: string;
  message?: string;
  /** JSON array of the actions. */
  actions: string;
  /** Which side of the target the tip prefers; it moves if there is no room. */
  preferredEdge?: CodegenTypes.WithDefault<'auto' | 'top' | 'bottom', 'auto'>;
  /** Width of the tip's content in points. */
  width?: CodegenTypes.WithDefault<CodegenTypes.Double, 280>;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onAction?: CodegenTypes.DirectEventHandler<ActionEvent>;
  onOpenChange?: CodegenTypes.DirectEventHandler<OpenEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceTeachingTip');

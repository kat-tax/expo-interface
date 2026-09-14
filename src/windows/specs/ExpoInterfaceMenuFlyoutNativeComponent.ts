import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectEvent = Readonly<{index: CodegenTypes.Int32}>;
type OpenEvent = Readonly<{open: boolean}>;

/**
 * A WinUI 3 `MenuFlyout` shown from a XAML island. The island itself is an
 * empty, hit-test-invisible anchor laid over whatever opens the menu — the
 * kit's button, a canvas — and the flyout is placed against it: below it by
 * default, or at `x`/`y` (in the anchor's own coordinates) for a menu at a
 * point.
 *
 * `items` is a JSON array of `{label, glyph, swatch, active, role, disabled,
 * separator}`; a pick is reported by index and the flyout closes itself.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of the entries. */
  items: string;
  open: boolean;
  /** Whether `x`/`y` place the menu; otherwise it opens below the anchor. */
  atPoint?: boolean;
  x?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  y?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelect?: CodegenTypes.DirectEventHandler<SelectEvent>;
  onOpenChange?: CodegenTypes.DirectEventHandler<OpenEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceMenuFlyout');

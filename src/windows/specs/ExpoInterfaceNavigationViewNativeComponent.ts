import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectionEvent = Readonly<{index: CodegenTypes.Int32}>;
type PaneOpenEvent = Readonly<{open: boolean}>;

/**
 * A WinUI 3 `NavigationView` hosted in a XAML island: the Windows tab bar in
 * its top mode, or the navigation pane down the left of the window. `items`
 * is a JSON array of `{label, glyph, badge?, placement?}` — a count or text
 * in an `InfoBadge`; `footer` for the pane's foot, `settings` for WinUI's
 * own settings item — and the selection is reported by the item's index in
 * that array, wherever the item was placed.
 * The content beside or under it is React Native's: the kit renders the
 * focused tab's screens itself, and sizes the island to the pane.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of the tabs. */
  items: string;
  selectedIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
  /** Text in the bar's leading slot: the app's name. */
  header?: string;
  /**
   * WinUI's pane display modes: `top`, a row of items along the top;
   * `left`, the expanded pane, labels beside the glyphs; `compact`, the
   * pane at its glyph-only width. The side panes show the toggle button,
   * whose press is reported as `onPaneOpenChange`; the kit answers with the
   * island's width — `OpenPaneLength` (320) or `CompactPaneLength` (48) —
   * and the matching mode, and the mode change opens or closes the pane.
   */
  paneMode?: CodegenTypes.WithDefault<'top' | 'left' | 'compact', 'top'>;
  /**
   * The colour painted behind the control: the kit's scheme background. An
   * island's root is white where its content is transparent, and the pane
   * is transparent by design (WinUI's fills are for a Mica window).
   */
  background?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
  /** The pane wants to be open or closed: its toggle button was pressed, or a mode change flipped it. */
  onPaneOpenChange?: CodegenTypes.DirectEventHandler<PaneOpenEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceNavigationView');

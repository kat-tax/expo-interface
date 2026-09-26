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
 * focused tab's screens itself, and sizes the island to the pane. The
 * control's own back button, at the top of the pane or the start of the top
 * bar, is the window's way back through that content: the kit says whether
 * there is anywhere to go back to, and hears the press.
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
   * pane at its glyph-only width, which opens over the content; `minimal`,
   * only the pane's toggle button until the pane opens over the content.
   * The side panes show the toggle button, whose press is reported as
   * `onPaneOpenChange`. In the expanded pane the kit answers with the
   * island's width — `OpenPaneLength` (320) or `CompactPaneLength` (48) —
   * and the matching mode, and the mode change opens or closes the pane.
   * In the two overlay modes the kit widens the island over its content
   * and the pane opens inside it, at the control's own pace.
   */
  paneMode?: CodegenTypes.WithDefault<'top' | 'left' | 'compact' | 'minimal', 'top'>;
  /**
   * Whether the pane is open, for the two overlay modes (`IsPaneOpen`): a
   * change closes a pane the kit's smoke dismissed, or the toggle button's
   * opening is confirmed. Left unset in the other modes, where WinUI's own
   * mode change opens and closes the pane.
   */
  paneOpen?: boolean;
  /**
   * The height of the content the minimal pane opens over. The control is
   * kept at that height while the island shows only its toggle button, so
   * the island's growth on opening changes no size of the control's own,
   * which would leave the pane empty mid-animation.
   */
  paneHeight?: CodegenTypes.Double;
  /**
   * The colour painted behind the control: the kit's scheme background. An
   * island's root is white where its content is transparent, and the pane
   * is transparent by design (WinUI's fills are for a Mica window).
   */
  background?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  /**
   * The control's back button (`IsBackButtonVisible`, `IsBackEnabled`):
   * not drawn, drawn but disabled as at the root of an app, or enabled
   * because a screen can be gone back to.
   */
  backButton?: CodegenTypes.WithDefault<'hidden' | 'disabled' | 'enabled', 'hidden'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
  /** An item was pressed (`ItemInvoked`), the selected one included, which `onSelectionChange` never reports. */
  onItemInvoked?: CodegenTypes.DirectEventHandler<SelectionEvent>;
  /** The pane wants to be open or closed: its toggle button was pressed, or a mode change flipped it. */
  onPaneOpenChange?: CodegenTypes.DirectEventHandler<PaneOpenEvent>;
  /** The back button was pressed (`BackRequested`). */
  onBackRequested?: CodegenTypes.DirectEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceNavigationView');

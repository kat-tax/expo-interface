import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectionEvent = Readonly<{index: CodegenTypes.Int32}>;
type CloseEvent = Readonly<{index: CodegenTypes.Int32}>;
type MenuEvent = Readonly<{index: CodegenTypes.Int32; x: CodegenTypes.Double; y: CodegenTypes.Double}>;

/**
 * A WinUI 3 `TabView` hosted in a XAML island, as **the strip alone**: the row
 * of titles with their close crosses and the add button at its end, sized to
 * its own header height, with the selected tab's content drawn under it by
 * React Native.
 *
 * The tabs carry no XAML content, because content inside an island would have
 * to be XAML and the pages here are React Native's (a React portal connects
 * inside an island and is even reported to UI Automation, and
 * react-native-windows 0.84 draws nothing in it). A `TabViewItem` with no content is still
 * a real tab — it is selected, closed, dragged and read by Narrator as the
 * control's own — so the strip is the platform's even though the pages are
 * not.
 *
 * `items` is a JSON array of `{title, glyph?, closable, depth, menu}`; the
 * selection and the close are both reported by the item's index in it, and
 * so is a right click or the Menu key on a tab that has a menu, with the
 * point in the island's coordinates for the kit's own menu to open at.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of the tabs. A change rebuilds every item. */
  items: string;
  /**
   * JSON array of each tab's UI Automation name, in the order of `items`.
   * Apart from `items` because a name follows what an accessory says (a
   * collaborator joining, an unsaved mark): a change renames the items in
   * place, keeping the strip, its focus and Narrator's place in it.
   */
  labels: string;
  selectedIndex?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;
  /**
   * What the strip is called to UI Automation. An island names its own
   * control: `accessibilityLabel` reaches the React view, not the XAML one,
   * so without this Narrator reads the strip as an unnamed tab control.
   */
  label?: string;
  /** Show the add button at the end of the strip. */
  addButton?: CodegenTypes.WithDefault<boolean, false>;
  /**
   * What the add button is called to UI Automation and in its tooltip, in
   * place of WinUI's own name and tooltip for it. Left out or empty, the
   * button keeps WinUI's, which are in the system's language. Words once
   * given stay when the prop is taken away again: WinUI's are gone from the
   * button by then, and only a new template brings them back.
   */
  addLabel?: string;
  /**
   * The colour painted behind the strip: the kit's element background, or the
   * screen's background for the kit's `fill="none"`. An island's root is
   * white wherever its content is transparent, and a `TabView` is
   * transparent by design — its fills are for a Mica window.
   */
  background?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
  /** A tab's close cross was pressed. The kit removes the tab; the control does not. */
  onTabClose?: CodegenTypes.DirectEventHandler<CloseEvent>;
  /** The add button was pressed. */
  onAddTab?: CodegenTypes.DirectEventHandler<Readonly<{}>>;
  /** A right click or the Menu key on a tab with a menu, at a point in the island's coordinates. */
  onTabMenu?: CodegenTypes.DirectEventHandler<MenuEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceTabView');

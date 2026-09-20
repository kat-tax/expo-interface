import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type SelectionEvent = Readonly<{index: CodegenTypes.Int32}>;
type CloseEvent = Readonly<{index: CodegenTypes.Int32}>;

/**
 * A WinUI 3 `TabView` hosted in a XAML island, as **the strip alone**: the row
 * of titles with their close crosses and the add button at its end, sized to
 * its own header height, with the selected tab's content drawn under it by
 * React Native.
 *
 * The tabs carry no XAML content, because content inside an island would have
 * to be XAML and the pages here are React Native's (roadmap §3.6 ran the
 * experiment: a React portal connects inside an island and is even reported to
 * UI Automation, and draws nothing). A `TabViewItem` with no content is still
 * a real tab — it is selected, closed, dragged and read by Narrator as the
 * control's own — so the strip is the platform's even though the pages are
 * not.
 *
 * `items` is a JSON array of `{title, glyph?, closable}`; the selection and
 * the close are both reported by the item's index in it.
 */
export interface NativeProps extends ViewProps {
  /** JSON array of the tabs. */
  items: string;
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
   * The colour painted behind the strip: the kit's own element background. An
   * island's root is white wherever its content is transparent, and a
   * `TabView` is transparent by design — its fills are for a Mica window.
   */
  background?: string;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onSelectionChange?: CodegenTypes.DirectEventHandler<SelectionEvent>;
  /** A tab's close cross was pressed. The kit removes the tab; the control does not. */
  onTabClose?: CodegenTypes.DirectEventHandler<CloseEvent>;
  /** The add button was pressed. */
  onAddTab?: CodegenTypes.DirectEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceTabView');

import type {StyleProp, ViewStyle} from 'react-native';

/**
 * How the picker opens: `automatic` is the row with a well that opens the
 * platform's picker; `inline` draws the picker itself in place; `popover`
 * opens it beside the well; `menu` opens a menu of the swatches.
 */
export type ColorPickerPresentation = 'automatic' | 'inline' | 'popover' | 'menu';

/**
 * A preset color and its name: what a menu (`presentation="menu"`) lists and
 * what a screen reader reads, as "Color <name>".
 */
export interface ColorPickerSwatch {
  /** `#RRGGBB`. */
  color: string;
  /** Its name, such as "Ink". */
  name: string;
}

/**
 * Cross-platform color picker: a row with a label and a color well that
 * opens the system color picker.
 *
 * Bridges the SwiftUI `ColorPicker` on iOS. Android (Jetpack Compose) and
 * web (DOM) redraw the iOS row — the label and the well — and open a sheet
 * that reproduces the iOS picker: Grid, Spectrum and Sliders tabs, the
 * opacity slider and the preview swatch with saved colors.
 * A controlled control: pair `value` with `onValueChange`.
 */
export interface ColorPickerProps {
  /**
   * Label rendered at the leading edge of the row, and the title of the
   * picker it opens ("Colors" without one). A picker drawn in place
   * (`inline`) has a title only when given a label.
   */
  label?: string;
  /** Selected color as `#RRGGBB` or `#RRGGBBAA`, or an empty string for no color (`allowsNone`). */
  value: string;
  /**
   * Called with the new color whenever the user picks one, as `#RRGGBBAA`
   * when `supportsOpacity` is on and `#RRGGBB` otherwise.
   */
  onValueChange: (value: string) => void;
  /**
   * Shows the opacity slider and reports the alpha channel.
   * @default true
   */
  supportsOpacity?: boolean;
  /**
   * Preset colors, each `#RRGGBB` or a `ColorPickerSwatch` with its name,
   * drawn as a row of round swatches before the well on every platform, the
   * selected one ringed; tapping one picks it. A swatch's name is what a menu
   * lists and a screen reader reads; a color given alone is named by its hex.
   * The well still opens the full picker for any other color. More swatches
   * than the row's width holds wrap onto further lines rather than squeeze
   * (a Compose `FlowRow`, a wrapping flex row, lines of their own under the
   * label on iOS). `system` is the platform's own palette, its colors named:
   * Apple's system colors on iOS and web, Material's on Android, the Windows
   * accent colors on Windows.
   */
  swatches?: readonly (string | ColorPickerSwatch)[] | 'system';
  /**
   * How the picker opens (see `ColorPickerPresentation`), so a color is
   * chosen once from wherever it is asked: `inline` inside a sheet of the
   * app's own rather than a second sheet over it, `popover` from a toolbar,
   * `menu` from a palette of the swatches alone. An `inline` picker adds no
   * heading of its own under the sheet it sits in unless given a `label`.
   * @default 'automatic'
   */
  presentation?: ColorPickerPresentation;
  /**
   * A "No color" choice, beside the swatches and first in the menu, reported
   * as an empty string. An empty `value` draws the well crossed out.
   */
  allowsNone?: boolean;
  /** Disables interaction. */
  disabled?: boolean;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web and Windows). */
  style?: StyleProp<ViewStyle>;
}

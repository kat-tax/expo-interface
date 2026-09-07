import type {StyleProp, ViewStyle} from 'react-native';

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
  /** Label rendered at the leading edge of the row, and the title of the picker. */
  label?: string;
  /** Selected color as `#RRGGBB` or `#RRGGBBAA`. */
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
   * Preset colors (`#RRGGBB`) drawn as a row of round swatches before the
   * well on every platform, the selected one ringed; tapping one picks it.
   * The well still opens the full picker for any other color. More swatches
   * than the row's width holds wrap onto further lines rather than squeeze
   * (a Compose `FlowRow`, a wrapping flex row, lines of their own under the
   * label on iOS).
   */
  swatches?: string[];
  /** Disables interaction. */
  disabled?: boolean;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web only). */
  style?: StyleProp<ViewStyle>;
}

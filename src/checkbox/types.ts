import type {StyleProp, ViewStyle} from 'react-native';

/**
 * Cross-platform checkbox with a conformed Form-row appearance.
 *
 * Bridges a SwiftUI checkmark button on iOS (iOS has no native checkbox
 * control — a tinted `checkmark.square` glyph is the platform idiom), the
 * Jetpack Compose Material 3 `Checkbox` on Android, and the HTML
 * `<input type="checkbox">` element on web. A controlled control: pair
 * `value` with `onValueChange`.
 */
export interface CheckboxProps {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** Whether the box is checked. */
  value: boolean;
  /** Called when the user toggles the box. */
  onValueChange: (value: boolean) => void;
  /** Disables interaction. */
  disabled?: boolean;
  /** Tint applied to the checked box (overrides the theme accent tint). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web only). */
  style?: StyleProp<ViewStyle>;
}

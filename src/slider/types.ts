import type {StyleProp, ViewStyle} from 'react-native';

/**
 * Cross-platform slider for picking a value from a continuous or stepped range.
 *
 * Bridges the SwiftUI `Slider` on iOS, the Jetpack Compose Material 3 `Slider`
 * on Android, and the HTML `<input type="range">` element on web. A controlled
 * control: pair `value` with `onValueChange`.
 */
export interface SliderProps {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** Current value, between `min` and `max`. */
  value: number;
  /** Called continuously while the user drags the thumb. */
  onValueChange: (value: number) => void;
  /** Called once when the user releases the thumb. */
  onSlidingComplete?: (value: number) => void;
  /**
   * Minimum value of the range.
   * @default 0
   */
  min?: number;
  /**
   * Maximum value of the range.
   * @default 1
   */
  max?: number;
  /** Increment size. Omit for a continuous slider. */
  step?: number;
  /** Disables interaction. */
  disabled?: boolean;
  /** Tint applied to the thumb and filled track (overrides the theme accent). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web only). */
  style?: StyleProp<ViewStyle>;
}

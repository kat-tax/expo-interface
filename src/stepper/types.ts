import type {StyleProp, ViewStyle} from 'react-native';

/**
 * Cross-platform stepper: a numeric value with increment/decrement buttons.
 *
 * Bridges the SwiftUI `Stepper` on iOS, a pair of Jetpack Compose Material 3
 * icon buttons on Android (Compose has no stepper control), and native
 * `<button>` elements on web. A controlled control: pair `value` with
 * `onValueChange`.
 */
export interface StepperProps {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** Current value. */
  value: number;
  /** Called with the new value when a button is pressed. */
  onValueChange: (value: number) => void;
  /**
   * Amount added or subtracted per press.
   * @default 1
   */
  step?: number;
  /** Lower bound; the decrement button disables at this value. */
  min?: number;
  /** Upper bound; the increment button disables at this value. */
  max?: number;
  /** Formats the displayed value (web/android; iOS shows the raw number). */
  formatValue?: (value: number) => string;
  /** Disables interaction. */
  disabled?: boolean;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web only). */
  style?: StyleProp<ViewStyle>;
}

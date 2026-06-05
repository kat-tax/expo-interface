import type {StyleProp, ViewStyle} from 'react-native';

/**
 * Cross-platform toggle with a conformed iOS-style appearance.
 *
 * A controlled control: pair `value` with `onValueChange` to manage state.
 */
export interface SwitchProps {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** Whether the switch is on. */
  value: boolean;
  /** Called when the user toggles the switch. */
  onValueChange: (value: boolean) => void;
  /** Disables interaction. */
  disabled?: boolean;
  /** Tint applied to the "on" track (overrides the default iOS green). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web/android only). */
  style?: StyleProp<ViewStyle>;
}

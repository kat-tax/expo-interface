import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/** The type of values a {@link PickerItem} can carry. */
export type PickerValue = string | number;

/** Internal shape extracted from each `<Picker.Item>` child. */
export interface PickerOption<T extends PickerValue = PickerValue> {
  label: string;
  value: T;
}

/**
 * Props for the `Picker.Item` component. A data-only marker used to declare the
 * available options inside a {@link Picker}.
 */
export interface PickerItemProps<T extends PickerValue = PickerValue> {
  /** Display text for the option. */
  label: string;
  /** Value reported through `onValueChange` when this option is selected. */
  value: T;
}

/**
 * Cross-platform dropdown picker with a conformed iOS-style appearance.
 *
 * The control may be used controlled (pass `selectedValue` + `onValueChange`)
 * or uncontrolled (omit both and it manages its own state, seeded with the
 * first option).
 */
export interface PickerProps<T extends PickerValue = PickerValue> {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** Current value (controlled). When omitted the component keeps its own state. */
  selectedValue?: T;
  /** Called whenever the user selects an option. */
  onValueChange?: (value: T) => void;
  /** Disables interaction. */
  disabled?: boolean;
  /** Tint applied to the value text (web/android) and the native picker (iOS). */
  accentColor?: string;
  /** `Picker.Item` children that define the available options. */
  children?: ReactNode;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web/android only). */
  style?: StyleProp<ViewStyle>;
}

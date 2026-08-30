import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {PickerValue} from '../picker/types';

/**
 * Cross-platform segmented control: a single-choice row of segments.
 *
 * Bridges the SwiftUI `Picker` in its `segmented` style on iOS, the Jetpack
 * Compose Material 3 `SingleChoiceSegmentedButtonRow` on Android, and a
 * `radiogroup` of native `<button>`s on web. Options are declared with
 * `SegmentedControl.Item` children, exactly like `Picker`. May be used
 * controlled (`selectedValue` + `onValueChange`) or uncontrolled.
 */
export interface SegmentedControlProps<T extends PickerValue = PickerValue> {
  /** Label rendered at the leading edge of the row, mirroring an iOS Form row. */
  label?: string;
  /** `SegmentedControl.Item` children that define the segments. */
  children?: ReactNode;
  /** Current value (controlled). When omitted the component keeps its own state. */
  selectedValue?: T;
  /** Called whenever the user selects a segment. */
  onValueChange?: (value: T) => void;
  /** Disables interaction. */
  disabled?: boolean;
  /** Tint of the selected segment (Android/web) or the picker (iOS). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web only). */
  style?: StyleProp<ViewStyle>;
}

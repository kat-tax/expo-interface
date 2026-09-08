import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {PickerValue} from '../picker/types';

/**
 * Control size of the segmented control. `medium` is the iOS system size
 * (a 32pt track with a 13pt label).
 */
export type SegmentedControlSize = 'small' | 'medium' | 'large';

/**
 * Border shape of the track and its segments. `rounded` is the iOS corner;
 * `pill` rounds both to a capsule. (There is no `circle`: a row of segments
 * has no square box to inscribe one in.)
 */
export type SegmentedControlShape = 'rounded' | 'pill';

/**
 * Cross-platform segmented control: a single-choice row of segments.
 *
 * Bridges the SwiftUI `Picker` in its `segmented` style on iOS — the system
 * `UISegmentedControl`, and the look the other two platforms are drawn to
 * match — a Jetpack Compose track of selectable segments on Android, and a
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
  /**
   * Fill of the selected segment — the iOS `selectedSegmentTintColor`, applied
   * on every platform. The label flips to black or white for contrast.
   * Defaults to the neutral raised fill (white light / #636366 dark).
   */
  accentColor?: string;
  /**
   * Control size.
   * @default 'medium'
   */
  size?: SegmentedControlSize;
  /**
   * Border shape of the track and its segments.
   * @default 'rounded'
   */
  shape?: SegmentedControlShape;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the row container (web only). */
  style?: StyleProp<ViewStyle>;
}

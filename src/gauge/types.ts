import type {StyleProp, ViewStyle} from 'react-native';

/**
 * Visual style of the gauge, named after the SwiftUI `GaugeStyle` it renders
 * (the `gaugeStyle` modifier names in `@expo/ui`):
 * - `automatic` — the default in-app style: a capacity bar with the label
 *   centered above and the current value centered below.
 * - `linear` — `accessoryLinear`: a bar with a point marker at the current
 *   value (no label).
 * - `linearCapacity` — `accessoryLinearCapacity`: a thin capacity bar with
 *   the label above and the current value below, aligned to its leading edge.
 * - `circular` — `accessoryCircular`: an open ring with a point marker, the
 *   current value in the center and the bounds under the ring.
 * - `circularCapacity` — `accessoryCircularCapacity`: a closed ring filled to
 *   the current value with the current value in the center.
 */
export type GaugeVariant = 'automatic' | 'linear' | 'linearCapacity' | 'circular' | 'circularCapacity';

/**
 * Cross-platform gauge showing a value within a range.
 *
 * Bridges the SwiftUI `Gauge` (iOS 16+) on iOS; Android (Jetpack Compose) and
 * web (DOM/SVG) redraw each SwiftUI style with the same geometry: the
 * bounds and current value labels take the accent, the descriptive label
 * keeps the label color, exactly as a tinted SwiftUI gauge does.
 */
export interface GaugeProps {
  /** Current value, between `min` and `max`. */
  value: number;
  /**
   * Lower bound of the range.
   * @default 0
   */
  min?: number;
  /**
   * Upper bound of the range.
   * @default 1
   */
  max?: number;
  /**
   * SwiftUI gauge style to render.
   * @default 'automatic'
   */
  variant?: GaugeVariant;
  /**
   * Text describing the gauge's purpose. Shown above the bar in the linear
   * capacity styles and in the center of the circular styles when there is
   * no `currentValueLabel`; the `linear` style only exposes it to assistive
   * technology.
   */
  label?: string;
  /** Text showing the current value. */
  currentValueLabel?: string;
  /** Text showing the lower bound. */
  minimumValueLabel?: string;
  /** Text showing the upper bound. */
  maximumValueLabel?: string;
  /** Tint of the indicator and the value labels (overrides the theme accent). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the container (web only). */
  style?: StyleProp<ViewStyle>;
}

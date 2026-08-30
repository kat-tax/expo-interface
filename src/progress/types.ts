/** Shape of the indicator. */
export type ProgressVariant = 'linear' | 'circular';

/**
 * Cross-platform progress indicator.
 *
 * Bridges the SwiftUI `ProgressView` (linear or circular style) on iOS, the
 * Jetpack Compose `LinearProgressIndicator` / `CircularProgressIndicator` on
 * Android, and the HTML `<meter>` element (linear) or an SVG ring (circular)
 * on web.
 */
export interface ProgressProps {
  /**
   * Progress value between `0` and `1`.
   * Omit for an indeterminate indicator (a spinner when `circular`; the linear
   * web bar has no indeterminate state and renders empty).
   */
  value?: number;
  /**
   * Bar or ring.
   * @default 'linear'
   */
  variant?: ProgressVariant;
  /**
   * Diameter of the circular indicator in points/dp. Ignored for `linear`,
   * and on iOS where the system spinner keeps its native size.
   * @default 24
   */
  size?: number;
  /** Color of the filled portion. Defaults to the theme tint. */
  color?: string;
  /** Color of the unfilled track behind the bar/ring. */
  trackColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

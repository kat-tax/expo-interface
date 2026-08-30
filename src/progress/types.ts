/**
 * Cross-platform determinate progress bar.
 *
 * Bridges the SwiftUI `ProgressView` on iOS, the Jetpack Compose
 * `LinearProgressIndicator` on Android, and the HTML `<meter>` element on web.
 */
export interface ProgressProps {
  /**
   * Progress value between `0` and `1`.
   * Omit for an indeterminate indicator (native only; web falls back to `0`).
   */
  value?: number;
  /** Color of the filled portion of the bar. Defaults to the theme tint. */
  color?: string;
  /** Color of the unfilled track behind the bar. */
  trackColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

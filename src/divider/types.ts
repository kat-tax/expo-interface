/**
 * Cross-platform hairline separator.
 *
 * Bridges the SwiftUI `Divider` on iOS, the Jetpack Compose Material 3
 * `HorizontalDivider` / `VerticalDivider` on Android, and the HTML `<hr>`
 * element on web.
 */
export interface DividerProps {
  /** Draw a vertical rule (for use inside a row) instead of a horizontal one. */
  vertical?: boolean;
  /** Line color. Defaults to the theme `separator` token. */
  color?: string;
  /**
   * Leading inset in points/dp, e.g. to align the rule with row content that
   * sits after a leading icon.
   */
  inset?: number;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

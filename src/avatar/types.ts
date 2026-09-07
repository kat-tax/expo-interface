/**
 * A person as a colored circle with their initials: the peers on a document,
 * the members of a space.
 *
 * Drawn in React Native on every platform, like `Surface` — an avatar is a
 * picture in a row of them, not a control, and it belongs wherever the row
 * is.
 */
export interface AvatarProps {
  /** The person's name: the initials and the accessible name come from it. */
  name: string;
  /** Letters to draw. Defaults to the initials of `name`. */
  initials?: string;
  /** Circle color. Defaults to a stable one hashed from the name. */
  color?: string;
  /**
   * Diameter in points.
   * @default 28
   */
  size?: number;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

import type {ColorTokens} from '../theme';

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
  /**
   * A 2 point ring inside the edge: a palette token (`background` parts
   * faces that overlap) or any color (the person's, while they type).
   */
  ring?: ColorTokens | (string & {});
  /** Drawn at half opacity: someone away, or not in the document now. */
  dimmed?: boolean;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

/** A person in an `AvatarGroup`. */
export interface AvatarGroupPerson extends Pick<AvatarProps, 'name' | 'initials' | 'color' | 'ring' | 'dimmed'> {
  /** Tells the faces apart when two people share a name. Defaults to the name and place. */
  key?: string;
}

/**
 * People as overlapping faces, a facepile: the peers on a document. Past
 * `max` the rest are counted in a `+N` face.
 */
export interface AvatarGroupProps {
  people: readonly AvatarGroupPerson[];
  /**
   * The faces drawn before the rest are counted.
   * @default 3
   */
  max?: number;
  /**
   * Diameter of each face, in points.
   * @default 24
   */
  size?: number;
  /**
   * The ring that parts the faces, a palette token or a color: the fill
   * behind the group. A person's own `ring` wins.
   * @default 'background'
   */
  ring?: ColorTokens | (string & {});
  /** Called when a face is pressed. */
  onPress?: (person: AvatarGroupPerson, index: number) => void;
  /** Called when a face is pressed and held. */
  onLongPress?: (person: AvatarGroupPerson, index: number) => void;
  /** Called when the `+N` face is pressed. */
  onPressMore?: () => void;
  testID?: string;
}

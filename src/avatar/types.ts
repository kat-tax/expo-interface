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

/**
 * A person in an `AvatarGroup`. Their face is a button when the group
 * presses and the circle itself when it does not (an image on web); either
 * one carries the person's label, hint and selected state.
 */
export interface AvatarGroupPerson extends Pick<AvatarProps, 'name' | 'initials' | 'color' | 'ring' | 'dimmed'> {
  /** Tells the faces apart when two people share a name. Defaults to the name and place. */
  key?: string;
  /**
   * What assistive technology calls the face, when it says more than the
   * name: "Follow Ada, on Notes". Defaults to `name`.
   */
  label?: string;
  /**
   * What a press or a press and hold on the face does, when the label does
   * not say: "Hold to go there once, without following". Read after the
   * label: the accessibility hint on iOS and Android, the help text on
   * Windows, the description on web.
   */
  hint?: string;
  /**
   * The chosen person: the one followed. Announced as selected, or on web
   * as the current one, since a button cannot be selected. It draws
   * nothing; show it with the person's `ring`.
   * @default false
   */
  selected?: boolean;
  /**
   * The face takes no press or press and hold and is announced as
   * unavailable: a person the view cannot be taken to. It is drawn at half
   * opacity, as every disabled control in the kit is. When the group does
   * not press, the face is a picture rather than a control, and `disabled`
   * only dims it.
   * @default false
   */
  disabled?: boolean;
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
  /** Called when a face is pressed, never for a `disabled` person. */
  onPress?: (person: AvatarGroupPerson, index: number) => void;
  /** Called when a face is pressed and held, never for a `disabled` person. */
  onLongPress?: (person: AvatarGroupPerson, index: number) => void;
  /** Called when the `+N` face is pressed. */
  onPressMore?: () => void;
  testID?: string;
}

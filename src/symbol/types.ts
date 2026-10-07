import type {IconToken, IconTone} from '../icons';

/**
 * An icon on its own: the kit's glyph drawn from a token on every platform.
 * Decorative, so it stays out of the accessible name of the control around
 * it; a control names itself.
 */
export interface IconProps {
  /** Icon to draw. Its `fill` picks the solid form. */
  icon: IconToken;
  /**
   * Glyph size in points.
   * @default 24
   */
  size?: number;
  /**
   * The color's role: the label color, the secondary or tertiary text
   * colors, the accent, the success green or the destructive red.
   * @default 'label'
   */
  tone?: IconTone;
  /** A color of its own, which wins over `tone`. */
  tintColor?: string;
  /** Identifier used to locate the glyph in end-to-end tests. */
  testID?: string;
}

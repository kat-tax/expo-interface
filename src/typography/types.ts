import type {StyleProp, TextStyle} from 'react-native';
import type {ReactNode} from 'react';
import type {ColorTokens} from '../theme';

export type TypographyVariant =
  | 'largeTitle'
  | 'title'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption'
  | 'label';

/** The levels a heading can sit at, as `aria-level` counts them. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The heading level each title variant stands at by default.
 *
 * A component cannot know the shape of the document it lands in, so these are
 * the ranks the type scale already implies rather than a promise about any
 * particular page. A caller who knows better passes `level`; a heading at a
 * slightly wrong level is still far better than the `<span>` every one of
 * these used to be, which no screen reader could navigate to at all.
 */
export const HEADING_LEVELS = {
  largeTitle: 1,
  title: 2,
  title2: 3,
  title3: 4,
  headline: 5,
} as const satisfies Partial<Record<TypographyVariant, HeadingLevel>>;

/** The level a variant is a heading at, or nothing where it is body text. */
export function headingLevel(variant: TypographyVariant, override?: HeadingLevel | false): HeadingLevel | undefined {
  if (override === false) return undefined;
  if (override) return override;
  return (HEADING_LEVELS as Partial<Record<TypographyVariant, HeadingLevel>>)[variant];
}

export type TypographyWeight =
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold';

export type TypographyAlign =
  | 'left'
  | 'center'
  | 'right';

export interface TypographyStyle {
  fontSize: number;
  fontWeight: TypographyWeight;
  lineHeight: number;
  letterSpacing?: number;
}

export interface TypographyProps {
  children: ReactNode;
  testID?: string;
  style?: StyleProp<TextStyle>;
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  align?: TypographyAlign;
  color?: ColorTokens;
  numberOfLines?: number;
  /**
   * The heading level this text stands at, overriding the one its variant
   * implies. Pass `false` for a title-sized line that is not a heading — a
   * number in a stat tile, a word set large for emphasis.
   */
  level?: HeadingLevel | false;
}

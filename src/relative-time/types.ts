import type {ColorTokens} from '../theme';
import type {TypographyVariant} from '../typography/types';

/** A moment as the time since or until it (see `RelativeTime`). */
export interface RelativeTimeProps {
  /** The moment, as a `Date` or milliseconds since the epoch. */
  date: Date | number;
  /**
   * The type style.
   * @default 'footnote'
   */
  variant?: TypographyVariant;
  /**
   * The text color.
   * @default 'secondaryLabel'
   */
  color?: ColorTokens;
  /**
   * `auto` says "now" and "yesterday" where the language has words for
   * them; `always` says "1 day ago".
   * @default 'auto'
   */
  numeric?: 'auto' | 'always';
  numberOfLines?: number;
  testID?: string;
}

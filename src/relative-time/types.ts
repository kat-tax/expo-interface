import type {ColorTokens} from '../theme';
import type {TypographyVariant} from '../typography/types';

/** How `useRelativeTime` and `RelativeTime` say a moment. */
export interface RelativeTimeOptions {
  /**
   * `auto` says "now" and "yesterday" where the language has words for
   * them; `always` says "1 day ago".
   * @default 'auto'
   */
  numeric?: 'auto' | 'always';
  /**
   * The language of the words, a BCP 47 tag (`en`, `de`, `pt-BR`). On the
   * web it is the page's own language by default, the `lang` of its
   * `<html>`, so the words follow the app rather than the browser; elsewhere
   * it is the engine's. A tag the engine cannot read falls back to the
   * engine's default. The words come from `Intl.RelativeTimeFormat`, which
   * Hermes does not have: on iOS, Android and Windows they are English
   * unless the app installs a polyfill for it.
   */
  locale?: string;
}

/** A moment as the time since or until it (see `RelativeTime`). */
export interface RelativeTimeProps extends RelativeTimeOptions {
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
  numberOfLines?: number;
  testID?: string;
}

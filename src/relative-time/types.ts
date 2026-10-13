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
   * `<html>`, so the words follow the app rather than the browser. Elsewhere
   * it is the locale `Intl.DateTimeFormat` reports. On iOS that is the
   * language the system runs the app in: the device's when the app is
   * localized for it (the app config's `locales`, or `CFBundleLocalizations`),
   * else the app's base language, English in an Expo app. On Android it is
   * the device's language, and on Windows the user's regional format. To
   * follow the device's language whatever the app is localized for, pass
   * one, such as `getLocales()[0].languageTag` from `expo-localization`. A
   * tag the engine cannot read falls back to the engine's default. The
   * words come from `Intl.RelativeTimeFormat`, which Hermes does not have:
   * on iOS, Android and Windows they are English unless the app installs a
   * polyfill for it and for the `Intl.PluralRules` it needs (FormatJS's
   * `@formatjs/intl-relativetimeformat` and `@formatjs/intl-pluralrules`,
   * with locale data for every language the app speaks). Where the engine's
   * formatter cannot be made at all, the words are English.
   */
  locale?: string;
  /**
   * How long the words are. `long` says "12 minutes ago" and "in 3 months";
   * `short` abbreviates the unit, "12 min. ago" and "in 3 mo."; `narrow`
   * sets a letter or two against the count, "12m ago" and "in 3mo", for a
   * line with no room to spare, such as a `Card`'s subtitle. "now",
   * "yesterday" and "tomorrow" read the same in every style. Where the
   * engine has `Intl.RelativeTimeFormat`, the words are its own for the
   * style and the language; where it does not (Hermes, see `locale`), they
   * are these English ones. The short and narrow words are for the eye: a
   * `RelativeTime` in either names itself with the long ones on iOS,
   * Android and Windows, so a screen reader says "12 minutes ago" over
   * "12m ago", and `useRelativeTime` hands them over beside the text with
   * `spoken`. On the web the component is the text alone, since an
   * `aria-label` on plain text is not read.
   * @default 'long'
   */
  style?: 'long' | 'short' | 'narrow';
}

/** How `useRelativeTime` says a moment, and whether the long words come with it. */
export interface UseRelativeTimeOptions extends RelativeTimeOptions {
  /**
   * Answer the long words beside the ones in `style`, as `{text, spoken}`,
   * for text shown short or narrow and spoken in full: a `Card`'s subtitle
   * in `narrow`, with the card named in the long words through its `label`.
   * Both come from the same moment and the same timer. Without it the hook
   * answers the words in `style` as a string.
   * @default false
   */
  spoken?: boolean;
}

/** What `useRelativeTime` answers with `spoken`: the words to show, and the words to say. */
export interface RelativeTimeWords {
  /** The words in the `style` asked for. */
  text: string;
  /** The same moment in the `long` style, for a screen reader. */
  spoken: string;
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

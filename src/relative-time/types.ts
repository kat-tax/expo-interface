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

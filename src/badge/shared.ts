import type {BadgeProps} from './types';

/** The dot's diameter, and the height a numbered badge is drawn at. */
export const BADGE_SIZE = {dot: 8, count: 16} as const;

/** Space either side of the number, so a two-digit badge is a capsule not a circle. */
export const BADGE_PADDING = 5;

export const BADGE_FONT_SIZE = 11;

/** The geometry a drawn badge takes, so it matches its platform's own. */
export interface BadgeMetrics {
  /** The dot's diameter. */
  dot: number;
  /** The height of a numbered badge, and its width with one digit. */
  count: number;
  /** Space either side of the number. */
  padding: number;
  /** The weight of the number. */
  fontWeight: '500' | '600';
  /** The number's line height. */
  lineHeight: number;
  /** Extra space between the number's characters, if its type has any. */
  letterSpacing?: number;
}

/** The capsule UIKit draws: an 8 point dot, 16 points high with a number in semibold. */
export const UIKIT_BADGE: BadgeMetrics = {
  dot: BADGE_SIZE.dot,
  count: BADGE_SIZE.count,
  padding: BADGE_PADDING,
  fontWeight: '600',
  lineHeight: BADGE_FONT_SIZE + 1,
};

/**
 * Material 3's badge: a 6 dp dot, 16 dp high with a number in Label Small
 * (11 sp medium on a 16 sp line, tracked 0.5 sp), with 4 dp either side of
 * it. The Compose `Badge` inside a host sets its number in Label Small too,
 * so a drawn badge and a hosted one match.
 */
export const MATERIAL_BADGE: BadgeMetrics = {
  dot: 6,
  count: 16,
  padding: 4,
  fontWeight: '500',
  lineHeight: 16,
  letterSpacing: 0.5,
};

/**
 * What the badge draws, or `null` when it draws nothing.
 *
 * A count of zero is not news, so it is nothing unless the caller says
 * otherwise; a count past `max` is `99+`, so a badge cannot grow without bound
 * and shove the layout around it.
 */
export function badgeText({count, max = 99, showZero, dot}: BadgeProps): string | null {
  if (dot) return '';
  if (count == null) return null;
  if (count === 0 && !showZero) return null;
  return count > max ? `${max}+` : String(count);
}

/**
 * The number for a control that holds a number and nothing else — WinUI's
 * `InfoBadge`. Negative is its dot form.
 *
 * An overflowing count comes back as the cap rather than as `99+`, which the
 * control cannot draw. That is a visible difference from the other three
 * platforms, and the only one: the accessible name still says `99+ new`.
 */
export function badgeValue(props: BadgeProps): number {
  if (props.dot || props.count == null) return -1;
  return Math.min(props.count, props.max ?? 99);
}

/**
 * What a screen reader says. A bare number is not worth announcing — "3" on
 * its own tells nobody anything — so a caller's `label` wins, and the fallback
 * at least says what kind of thing the number is.
 */
export function badgeLabel(props: BadgeProps, text: string): string {
  if (props.label) return props.label;
  return props.dot ? 'New' : `${text} new`;
}

/**
 * What the label says past the number the badge draws, for a badge whose
 * number a screen reader reads by itself (the Compose badge on Android):
 * "new" of "3 new", the whole label of a dot or of a label that does not
 * start with the number, and nothing when the label is the number alone.
 */
export function badgeWordsAfter(label: string, text: string): string {
  return (label.startsWith(text) ? label.slice(text.length) : label).trim();
}

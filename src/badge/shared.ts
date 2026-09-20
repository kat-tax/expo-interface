import type {BadgeProps} from './types';

/** The dot's diameter, and the height a numbered badge is drawn at. */
export const BADGE_SIZE = {dot: 8, count: 16} as const;

/** Space either side of the number, so a two-digit badge is a capsule not a circle. */
export const BADGE_PADDING = 5;

export const BADGE_FONT_SIZE = 11;

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

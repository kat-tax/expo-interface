/**
 * A tab's badge as the bar draws it: a count past `max` as `max+`, as
 * `Badge max` draws one, text as it is, and nothing for `0` or an empty
 * string.
 */
export function tabBadge(badge: number | string | undefined, max: number): string | null {
  if (badge == null || badge === 0 || badge === '') return null;
  return typeof badge === 'number' && badge > max ? `${max}+` : String(badge);
}

/**
 * A tab's badge for WinUI's `InfoBadge`, which holds a number and nothing
 * else: a count past `max` is the cap, as the kit's `Badge` draws it there,
 * and text stays text, which the island draws as the badge's dot.
 */
export function tabBadgeValue(badge: number | string | undefined, max: number): number | string | null {
  if (badge == null || badge === 0 || badge === '') return null;
  return typeof badge === 'number' ? Math.min(badge, max) : badge;
}

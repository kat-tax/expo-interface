const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type Unit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

/**
 * The unit a distance is said in, and where the next one takes over: under
 * 45 seconds is "now", then minutes up to 45, hours up to 22, days up to 26,
 * months up to 11, and years. The thresholds round as a person does, so 50
 * minutes is "1 hour" rather than "50 minutes".
 */
const SCALE: readonly [Unit, number, number][] = [
  ['minute', MINUTE, 45 * MINUTE],
  ['hour', HOUR, 22 * HOUR],
  ['day', DAY, 26 * DAY],
  ['month', 30 * DAY, 320 * DAY],
  ['year', 365 * DAY, Number.POSITIVE_INFINITY],
];

/** The longest a timer may wait: browsers fire a longer one at once. */
const MAX_DELAY = 2 ** 31 - 1;

/**
 * What a moment reads as from `now`, and in how many milliseconds that may
 * change: at 45 seconds for "now", and every half unit after, so a minute
 * count is never more than half a minute behind.
 */
export function relative(time: number, now: number, numeric: 'auto' | 'always'): {text: string; next: number} {
  const distance = time - now;
  const span = Math.abs(distance);
  if (span < 45 * SECOND) return {text: say(0, 'second', 'auto'), next: 45 * SECOND - span + 1};
  const [unit, size] = SCALE.find(([, , until]) => span < until)!;
  const value = Math.max(1, Math.round(span / size)) * Math.sign(distance);
  return {text: say(value, unit, numeric), next: Math.min(MAX_DELAY, size / 2)};
}

/** The words for a distance: the locale's where the engine has `Intl.RelativeTimeFormat`, English where it does not. */
function say(value: number, unit: Unit, numeric: 'auto' | 'always'): string {
  if (typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function') {
    return new Intl.RelativeTimeFormat(undefined, {numeric}).format(value, unit);
  }
  return english(value, unit, numeric);
}

export function english(value: number, unit: Unit, numeric: 'auto' | 'always'): string {
  if (value === 0) return 'now';
  if (numeric === 'auto' && unit === 'day' && Math.abs(value) === 1) return value < 0 ? 'yesterday' : 'tomorrow';
  const count = Math.abs(value);
  const words = `${count} ${unit}${count === 1 ? '' : 's'}`;
  return value < 0 ? `${words} ago` : `in ${words}`;
}

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
 * What a moment reads as from `now`, in `locale` (the engine's default
 * without one), and in how many milliseconds that may change: at 45 seconds
 * for "now", and every half unit after, so a minute count is never more than
 * half a minute behind.
 */
export function relative(time: number, now: number, numeric: 'auto' | 'always', locale?: string): {text: string; next: number} {
  const distance = time - now;
  const span = Math.abs(distance);
  if (span < 45 * SECOND) return {text: say(0, 'second', 'auto', locale), next: 45 * SECOND - span + 1};
  const [unit, size] = SCALE.find(([, , until]) => span < until)!;
  const value = Math.max(1, Math.round(span / size)) * Math.sign(distance);
  return {text: say(value, unit, numeric, locale), next: Math.min(MAX_DELAY, size / 2)};
}

/**
 * The words for a distance: the locale's where the engine has
 * `Intl.RelativeTimeFormat`, English where it does not. The engine is asked
 * on every call, so a polyfill the app installs at startup is used.
 */
function say(value: number, unit: Unit, numeric: 'auto' | 'always', locale: string | undefined): string {
  if (typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function') {
    return formatter(locale, numeric).format(value, unit);
  }
  return english(value, unit, numeric);
}

/** One formatter per language and style, so a list of times makes one rather than one per row per tick. */
const formatters = new Map<string, Intl.RelativeTimeFormat>();

/** The formatter for a language and style; a tag the engine cannot read (`en_US`) gets the engine's default rather than throwing during a render. */
function formatter(locale: string | undefined, numeric: 'auto' | 'always'): Intl.RelativeTimeFormat {
  const key = `${locale ?? ''}|${numeric}`;
  let format = formatters.get(key);
  if (!format) {
    try {
      format = new Intl.RelativeTimeFormat(locale, {numeric});
    } catch {
      format = new Intl.RelativeTimeFormat(undefined, {numeric});
    }
    formatters.set(key, format);
  }
  return format;
}

export function english(value: number, unit: Unit, numeric: 'auto' | 'always'): string {
  if (value === 0) return 'now';
  if (numeric === 'auto' && unit === 'day' && Math.abs(value) === 1) return value < 0 ? 'yesterday' : 'tomorrow';
  const count = Math.abs(value);
  const words = `${count} ${unit}${count === 1 ? '' : 's'}`;
  return value < 0 ? `${words} ago` : `in ${words}`;
}

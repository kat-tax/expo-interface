const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type Unit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
type Style = 'long' | 'short' | 'narrow';

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
 * without one) and `style` (`long` without one), and in how many
 * milliseconds that may change: at 45 seconds for "now", and every half unit
 * after, so a minute count is never more than half a minute behind.
 */
export function relative(time: number, now: number, numeric: 'auto' | 'always', locale?: string, style: Style = 'long'): {text: string; next: number} {
  const distance = time - now;
  const span = Math.abs(distance);
  if (span < 45 * SECOND) return {text: say(0, 'second', 'auto', locale, style), next: 45 * SECOND - span + 1};
  const [unit, size] = SCALE.find(([, , until]) => span < until)!;
  const value = Math.max(1, Math.round(span / size)) * Math.sign(distance);
  return {text: say(value, unit, numeric, locale, style), next: Math.min(MAX_DELAY, size / 2)};
}

/**
 * The words for a distance, in `style`: the locale's where the engine has
 * `Intl.RelativeTimeFormat`, English where it does not. The engine is asked
 * on every call, so a polyfill the app installs at startup is used.
 */
function say(value: number, unit: Unit, numeric: 'auto' | 'always', locale: string | undefined, style: Style): string {
  if (typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function') {
    const format = formatter(Intl.RelativeTimeFormat, locale, numeric, style);
    if (format) return format.format(value, unit);
  }
  return english(value, unit, numeric, style);
}

/**
 * One formatter per engine, language, numeric form and style, so a list of
 * times makes one rather than one per row per tick; `null` for one the
 * engine could not make.
 */
const formatters = new WeakMap<typeof Intl.RelativeTimeFormat, Map<string, Intl.RelativeTimeFormat | null>>();

/**
 * The formatter for a language, numeric form and style. A tag the engine
 * cannot read (`en_US`) gets the engine's default, and an engine that cannot
 * make even that, as a polyfill missing the `Intl.PluralRules` it needs,
 * gets none: the words are English rather than an error during a render.
 */
function formatter(Engine: typeof Intl.RelativeTimeFormat, locale: string | undefined, numeric: 'auto' | 'always', style: Style): Intl.RelativeTimeFormat | null {
  let made = formatters.get(Engine);
  if (!made) {
    made = new Map();
    formatters.set(Engine, made);
  }
  const key = `${locale ?? ''}|${numeric}|${style}`;
  if (made.has(key)) return made.get(key)!;
  let format: Intl.RelativeTimeFormat | null;
  try {
    format = new Engine(locale, {numeric, style});
  } catch {
    try {
      format = new Engine(undefined, {numeric, style});
    } catch {
      format = null;
    }
  }
  made.set(key, format);
  return format;
}

/**
 * The English unit words by style, as CLDR has them: `long` the word,
 * `short` its abbreviation, `narrow` a letter or two set against the count,
 * with `space` between the count and the word. Each is the form for a count
 * of one and the form for any other.
 */
const ENGLISH: Record<Style, {space: string; units: Record<Unit, readonly [one: string, other: string]>}> = {
  long: {
    space: ' ',
    units: {second: ['second', 'seconds'], minute: ['minute', 'minutes'], hour: ['hour', 'hours'], day: ['day', 'days'], month: ['month', 'months'], year: ['year', 'years']},
  },
  short: {
    space: ' ',
    units: {second: ['sec.', 'sec.'], minute: ['min.', 'min.'], hour: ['hr.', 'hr.'], day: ['day', 'days'], month: ['mo.', 'mo.'], year: ['yr.', 'yr.']},
  },
  narrow: {
    space: '',
    units: {second: ['s', 's'], minute: ['m', 'm'], hour: ['h', 'h'], day: ['d', 'd'], month: ['mo', 'mo'], year: ['y', 'y']},
  },
};

/**
 * The English words, where the engine has no formatter: "now", "yesterday"
 * and "tomorrow" in every style, else the count and the unit's word for
 * `style`, after "in" or before "ago".
 */
export function english(value: number, unit: Unit, numeric: 'auto' | 'always', style: Style): string {
  if (value === 0) return 'now';
  if (numeric === 'auto' && unit === 'day' && Math.abs(value) === 1) return value < 0 ? 'yesterday' : 'tomorrow';
  const count = Math.abs(value);
  const {space, units} = ENGLISH[style];
  const words = `${count}${space}${units[unit][count === 1 ? 0 : 1]}`;
  return value < 0 ? `${words} ago` : `in ${words}`;
}

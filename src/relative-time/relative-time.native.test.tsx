import {Platform} from 'react-native';
import {act, render, renderHook, screen} from '@testing-library/react-native';
import {english, relative} from './shared';
import {RelativeTime, useRelativeTime} from '.';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 9, 7, 12);

describe('relative', () => {
  it('says now, then minutes, hours, days, months and years, past and future, in the locale\'s words', () => {
    expect(relative(NOW - 10 * SECOND, NOW, 'auto').text).toBe('now');
    expect(relative(NOW - 5 * MINUTE, NOW, 'auto').text).toBe('5 minutes ago');
    expect(relative(NOW + 5 * MINUTE, NOW, 'auto').text).toBe('in 5 minutes');
    expect(relative(NOW - 50 * MINUTE, NOW, 'auto').text).toBe('1 hour ago');
    expect(relative(NOW - DAY, NOW, 'auto').text).toBe('yesterday');
    expect(relative(NOW - DAY, NOW, 'always').text).toBe('1 day ago');
    expect(relative(NOW - 40 * DAY, NOW, 'auto').text).toBe('last month');
    expect(relative(NOW - 400 * DAY, NOW, 'always').text).toBe('1 year ago');
  });

  it('says when it changes: at 45 seconds for now, and every half unit after', () => {
    expect(relative(NOW - 10 * SECOND, NOW, 'auto').next).toBe(35 * SECOND + 1);
    expect(relative(NOW - 5 * MINUTE, NOW, 'auto').next).toBe(30 * SECOND);
    expect(relative(NOW - 3 * HOUR, NOW, 'auto').next).toBe(30 * MINUTE);
    // A timer cannot wait longer than a 32-bit count of milliseconds.
    expect(relative(NOW - 400 * DAY, NOW, 'auto').next).toBe(2 ** 31 - 1);
  });

  it('falls back to English where the engine has no Intl.RelativeTimeFormat', () => {
    vi.stubGlobal('Intl', {...Intl, RelativeTimeFormat: undefined});
    try {
      expect(relative(NOW - 5 * MINUTE, NOW, 'auto').text).toBe('5 minutes ago');
      expect(relative(NOW + MINUTE, NOW, 'auto').text).toBe('in 1 minute');
      expect(relative(NOW - DAY, NOW, 'auto').text).toBe('yesterday');
      expect(relative(NOW + DAY, NOW, 'auto').text).toBe('tomorrow');
      expect(relative(NOW - DAY, NOW, 'always').text).toBe('1 day ago');
      expect(relative(NOW, NOW, 'auto').text).toBe('now');
    } finally {
      vi.unstubAllGlobals();
    }
    expect(english(-2, 'hour', 'auto')).toBe('2 hours ago');
  });

  it('says it in the language asked for, and in the engine\'s where the engine cannot read the tag', () => {
    expect(relative(NOW - 2 * HOUR, NOW, 'auto', 'de').text).toBe('vor 2 Stunden');
    expect(relative(NOW - 3 * HOUR, NOW, 'auto', 'de').text).toBe('vor 3 Stunden');
    expect(relative(NOW - 10 * SECOND, NOW, 'auto', 'de').text).toBe('jetzt');
    expect(relative(NOW - DAY, NOW, 'always', 'de').text).toBe('vor 1 Tag');
    expect(relative(NOW - 2 * HOUR, NOW, 'auto', 'en_US').text).toBe('2 hours ago');
  });

  it('makes one formatter for a language and style, however many times say it', () => {
    let made = 0;
    const Engine = Intl.RelativeTimeFormat;
    class Counted extends Engine {
      constructor(locale?: string, options?: Intl.RelativeTimeFormatOptions) {
        super(locale, options);
        made += 1;
      }
    }
    vi.stubGlobal('Intl', Object.create(Intl, {RelativeTimeFormat: {value: Counted}}));
    try {
      // Italian, which no earlier test asked for, so the first call makes its formatter.
      expect(relative(NOW - 2 * HOUR, NOW, 'auto', 'it').text).toBe('2 ore fa');
      expect(relative(NOW - 3 * HOUR, NOW, 'auto', 'it').text).toBe('3 ore fa');
      expect(relative(NOW - DAY, NOW, 'auto', 'it').text).toBe('ieri');
      expect(made).toBe(1);
      // Another style is another formatter.
      expect(relative(NOW - DAY, NOW, 'always', 'it').text).toBe('1 giorno fa');
      expect(made).toBe(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('says English where the engine cannot make a formatter, as a polyfill missing Intl.PluralRules', () => {
    let tried = 0;
    class Broken {
      constructor() {
        tried += 1;
        throw new TypeError('Intl.PluralRules is not available');
      }
    }
    vi.stubGlobal('Intl', Object.create(Intl, {RelativeTimeFormat: {value: Broken}}));
    try {
      expect(relative(NOW - 5 * MINUTE, NOW, 'auto', 'de').text).toBe('5 minutes ago');
      expect(relative(NOW - DAY, NOW, 'auto', 'de').text).toBe('yesterday');
      // Tried once with the tag and once with the default, then not again.
      expect(tried).toBe(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe(`RelativeTime (${Platform.OS})`, () => {
  beforeEach(() => {
    vi.useFakeTimers({now: NOW});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps itself current as the time passes, alone', async () => {
    await render(<RelativeTime date={new Date(NOW - 10 * SECOND)} testID="when"/>);
    const text = () => screen.getByTestId('when').props.children as string;
    expect(text()).toBe('now');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(40 * SECOND);
    });
    expect(text()).toBe('1 minute ago');
    // Each tick renders and sets the next, half a minute on.
    for (let tick = 0; tick < 8; tick++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30 * SECOND);
      });
    }
    expect(text()).toBe('5 minutes ago');
  });

  it('says a new moment from when it arrives, not from the last tick', async () => {
    const {rerender} = await render(<RelativeTime date={NOW - 3 * HOUR} testID="when"/>);
    const text = () => screen.getByTestId('when').props.children as string;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20 * MINUTE);
    });
    // The hour unit ticks every half hour, so nothing has rendered since.
    expect(text()).toBe('3 hours ago');
    await rerender(<RelativeTime date={Date.now()} testID="when"/>);
    expect(text()).toBe('now');
  });

  it('takes a language of its own', async () => {
    await render(<RelativeTime date={NOW - 2 * HOUR} locale="de" testID="when"/>);
    expect(screen.getByTestId('when').props.children).toBe('vor 2 Stunden');
  });

  it('takes a time in milliseconds, a style and a color', async () => {
    await render(<RelativeTime date={NOW - 2 * HOUR} variant="caption" color="tertiaryLabel" numeric="always" numberOfLines={1} testID="when"/>);
    expect(screen.getByTestId('when').props.children).toBe('2 hours ago');
    expect(screen.getByTestId('when').props.numberOfLines).toBe(1);
  });
});

describe(`useRelativeTime (${Platform.OS})`, () => {
  beforeEach(() => {
    vi.useFakeTimers({now: NOW});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('answers the words as a string, in the device\'s language without a locale, and keeps them current', async () => {
    const {result} = await renderHook(() => useRelativeTime(NOW - DAY + 20 * MINUTE));
    expect(result.current).toBe('yesterday');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12 * HOUR);
    });
    expect(result.current).toBe('yesterday');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12 * HOUR);
    });
    expect(result.current).toBe('2 days ago');
  });

  it('takes a Date, the numeric style and a language', async () => {
    const {result} = await renderHook(() => useRelativeTime(new Date(NOW - DAY), {numeric: 'always', locale: 'de'}));
    expect(result.current).toBe('vor 1 Tag');
  });

  it('says the device\'s language without a locale, as Intl.DateTimeFormat reports it, read once', async () => {
    let read = 0;
    // A device set to German, as Hermes reports it. A function, since the
    // transform's subclass of a built-in would not keep its own methods.
    function German() {
      read += 1;
      return {resolvedOptions: () => ({locale: 'de-DE'})};
    }
    vi.stubGlobal('Intl', Object.create(Intl, {DateTimeFormat: {value: German}}));
    try {
      const {result, rerender} = await renderHook(({date}: {date: number}) => useRelativeTime(date), {initialProps: {date: NOW - 2 * HOUR}});
      expect(result.current).toBe('vor 2 Stunden');
      await rerender({date: NOW - 3 * HOUR});
      expect(result.current).toBe('vor 3 Stunden');
      expect(read).toBe(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('says the engine\'s default where there is no Intl.DateTimeFormat, and English where there is no Intl', async () => {
    vi.stubGlobal('Intl', Object.create(Intl, {DateTimeFormat: {value: undefined}}));
    try {
      expect((await renderHook(() => useRelativeTime(NOW - 2 * HOUR))).result.current).toBe('2 hours ago');
      vi.stubGlobal('Intl', undefined);
      expect((await renderHook(() => useRelativeTime(NOW - 2 * HOUR))).result.current).toBe('2 hours ago');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

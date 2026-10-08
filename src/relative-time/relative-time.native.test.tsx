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
    // The same language and style again is the formatter already made.
    expect(relative(NOW - 3 * HOUR, NOW, 'auto', 'de').text).toBe('vor 3 Stunden');
    expect(relative(NOW - 10 * SECOND, NOW, 'auto', 'de').text).toBe('jetzt');
    expect(relative(NOW - DAY, NOW, 'always', 'de').text).toBe('vor 1 Tag');
    expect(relative(NOW - 2 * HOUR, NOW, 'auto', 'en_US').text).toBe('2 hours ago');
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

  it('answers the words as a string, in the engine\'s language without a locale, and keeps them current', async () => {
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
});

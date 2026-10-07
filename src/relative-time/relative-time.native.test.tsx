import {Platform} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {english, relative} from './shared';
import {RelativeTime} from '.';

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

  it('takes a time in milliseconds, a style and a color', async () => {
    await render(<RelativeTime date={NOW - 2 * HOUR} variant="caption" color="tertiaryLabel" numeric="always" numberOfLines={1} testID="when"/>);
    expect(screen.getByTestId('when').props.children).toBe('2 hours ago');
    expect(screen.getByTestId('when').props.numberOfLines).toBe(1);
  });
});

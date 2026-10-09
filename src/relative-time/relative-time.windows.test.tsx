import {render, renderHook, screen} from '@testing-library/react-native';
import {RelativeTime, useRelativeTime} from '.';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const NOW = Date.UTC(2026, 9, 7, 12);

describe('RelativeTime (windows)', () => {
  beforeEach(() => {
    vi.useFakeTimers({now: NOW});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('draws the time since in the locale Hermes reports, with no page to read one from', async () => {
    await render(<RelativeTime date={NOW - 2 * HOUR} testID="when"/>);
    expect(screen.getByTestId('when').props.children).toBe('2 hours ago');
    // A German regional format, as Hermes on Windows reports it: with the
    // format's calendar and hour cycle, as `en-US-u-ca-gregory-hc-h12` is
    // for a US one.
    function German() {
      return {resolvedOptions: () => ({locale: 'de-DE-u-ca-gregory-hc-h23'})};
    }
    vi.stubGlobal('Intl', Object.create(Intl, {DateTimeFormat: {value: German}}));
    try {
      await render(<RelativeTime date={NOW - 2 * HOUR} testID="german"/>);
      expect(screen.getByTestId('german').props.children).toBe('vor 2 Stunden');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('answers the words as a string, in a language of its own', async () => {
    const {result} = await renderHook(() => useRelativeTime(NOW - 2 * HOUR, {locale: 'de'}));
    expect(result.current).toBe('vor 2 Stunden');
  });

  it('takes a style, drawn and as a string', async () => {
    await render(<RelativeTime date={NOW - 12 * MINUTE} style="short" testID="when"/>);
    expect(screen.getByTestId('when').props.children).toBe('12 min. ago');
    const {result} = await renderHook(() => useRelativeTime(NOW - 12 * MINUTE, {style: 'narrow'}));
    expect(result.current).toBe('12m ago');
  });
});

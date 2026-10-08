import {act, cleanup, render, renderHook, screen} from '@testing-library/react';
import {RelativeTime, useRelativeTime} from '.';

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 7, 12);

beforeEach(() => {
  vi.useFakeTimers({now: NOW});
});

afterEach(() => {
  // Unmounted first, so no time hears the page's language go back.
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.lang = '';
});

describe('RelativeTime (web)', () => {
  it('draws the time since, in the type style, and keeps it current', async () => {
    render(<RelativeTime date={NOW - 2 * HOUR} testID="when"/>);
    expect(screen.getByTestId('when').textContent).toBe('2 hours ago');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(HOUR / 2);
    });
    expect(screen.getByTestId('when').textContent).toBe('3 hours ago');
  });

  it('speaks the page\'s language rather than the browser\'s, and a language of its own over both', () => {
    document.documentElement.lang = 'de';
    render(
      <>
        <RelativeTime date={NOW - 2 * HOUR} testID="page"/>
        <RelativeTime date={NOW - 2 * HOUR} locale="fr" testID="own"/>
      </>,
    );
    expect(screen.getByTestId('page').textContent).toBe('vor 2 Stunden');
    expect(screen.getByTestId('own').textContent).toBe('il y a 2 heures');
  });

  it('follows the page when it changes its language', async () => {
    document.documentElement.lang = 'en';
    render(<RelativeTime date={NOW - 2 * HOUR} testID="when"/>);
    expect(screen.getByTestId('when').textContent).toBe('2 hours ago');
    await act(async () => {
      document.documentElement.lang = 'de';
    });
    expect(screen.getByTestId('when').textContent).toBe('vor 2 Stunden');
  });

  it('watches the page\'s language once for every time on it, and stops with the last', async () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const watching = () => observe.mock.calls.filter(([target]) => target === document.documentElement).length;
    const said = (...ids: string[]) => ids.map(id => screen.getByTestId(id).textContent);
    document.documentElement.lang = 'en';
    const {rerender, unmount} = render(
      <>
        <RelativeTime date={NOW - 2 * HOUR} testID="a"/>
        <RelativeTime date={NOW - 3 * HOUR} testID="b"/>
        <RelativeTime date={NOW - 4 * HOUR} testID="c"/>
      </>,
    );
    expect(watching()).toBe(1);
    await act(async () => {
      document.documentElement.lang = 'de';
    });
    expect(said('a', 'b', 'c')).toEqual(['vor 2 Stunden', 'vor 3 Stunden', 'vor 4 Stunden']);
    // One leaves; the others still hear the page.
    rerender(
      <>
        <RelativeTime date={NOW - 2 * HOUR} testID="a"/>
        <RelativeTime date={NOW - 3 * HOUR} testID="b"/>
      </>,
    );
    expect(disconnect).not.toHaveBeenCalled();
    await act(async () => {
      document.documentElement.lang = 'fr';
    });
    expect(said('a', 'b')).toEqual(['il y a 2 heures', 'il y a 3 heures']);
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(watching()).toBe(1);
  });
});

describe('useRelativeTime (web)', () => {
  it('answers the words as a string and keeps them current', async () => {
    const {result} = renderHook(() => useRelativeTime(NOW - 2 * HOUR));
    expect(result.current).toBe('2 hours ago');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(HOUR / 2);
    });
    expect(result.current).toBe('3 hours ago');
  });

  it('hydrates a static page in English, as the server rendered it, whatever the browser\'s language, then says the words in the page\'s', async () => {
    // A browser whose own language is German.
    const Engine = Intl.RelativeTimeFormat;
    class German extends Engine {
      constructor(locale?: string, options?: Intl.RelativeTimeFormatOptions) {
        super(locale ?? 'de', options);
      }
    }
    vi.stubGlobal('Intl', Object.create(Intl, {RelativeTimeFormat: {value: German}}));
    const said: string[] = [];
    function When() {
      // `always`, a style no earlier test made a formatter for, so this engine makes them.
      const text = useRelativeTime(NOW - 2 * HOUR, {numeric: 'always'});
      said.push(text);
      return <span data-testid="when">{text}</span>;
    }
    document.documentElement.lang = 'de';
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // What the server rendered: English, as it has no page to read a language from.
      const page = document.body.appendChild(document.createElement('div'));
      page.innerHTML = '<span data-testid="when">2 hours ago</span>';
      await act(async () => {
        render(<When/>, {container: page, hydrate: true});
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
      vi.unstubAllGlobals();
    }
    expect(said[0]).toBe('2 hours ago');
    expect(screen.getByTestId('when').textContent).toBe('vor 2 Stunden');
  });
});

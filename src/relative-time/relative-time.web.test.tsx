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

  it('hydrates a static page with the words the server had, then says them in the page\'s language', async () => {
    const said: string[] = [];
    function When() {
      const text = useRelativeTime(NOW - 2 * HOUR);
      said.push(text);
      return <span data-testid="when">{text}</span>;
    }
    // What the server rendered, which had no page to read its language from.
    const page = document.body.appendChild(document.createElement('div'));
    page.innerHTML = '<span data-testid="when">2 hours ago</span>';
    document.documentElement.lang = 'de';
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await act(async () => {
        render(<When/>, {container: page, hydrate: true});
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
    expect(said[0]).toBe('2 hours ago');
    expect(screen.getByTestId('when').textContent).toBe('vor 2 Stunden');
  });
});

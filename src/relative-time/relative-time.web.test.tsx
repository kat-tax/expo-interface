import {act, render, screen} from '@testing-library/react';
import {RelativeTime} from '.';

const NOW = Date.UTC(2026, 9, 7, 12);

describe('RelativeTime (web)', () => {
  beforeEach(() => {
    vi.useFakeTimers({now: NOW});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('draws the time since, in the type style, and keeps it current', async () => {
    render(<RelativeTime date={NOW - 2 * 60 * 60 * 1000} testID="when"/>);
    expect(screen.getByTestId('when').textContent).toBe('2 hours ago');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    });
    expect(screen.getByTestId('when').textContent).toBe('3 hours ago');
  });
});

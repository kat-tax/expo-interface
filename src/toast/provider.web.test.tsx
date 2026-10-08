import type {ToastApi} from './provider';
import {useEffect} from 'react';
import {act, render, screen} from '@testing-library/react';
import {ToastProvider, useToast} from './provider';

let toasts: ToastApi;
function Hand() {
  const api = useToast();
  useEffect(() => {
    toasts = api;
  });
  return null;
}

describe('ToastProvider (web)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces its toasts one at a time, each for its duration', async () => {
    render(<ToastProvider><Hand/></ToastProvider>);
    act(() => {
      toasts.show('Copied');
      toasts.show('Saved');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('stands its toast on the area\'s edge outside a safe-area provider', () => {
    render(<ToastProvider><Hand/></ToastProvider>);
    act(() => {
      toasts.show('Copied');
    });
    const floor = getComputedStyle(screen.getByTestId('toast-floor'));
    expect(floor.position).toBe('absolute');
    expect(floor.bottom).toBe('0px');
    // Only the toast in it takes presses.
    expect(floor.pointerEvents).toBe('none');
  });
});

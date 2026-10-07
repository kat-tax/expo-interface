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
});

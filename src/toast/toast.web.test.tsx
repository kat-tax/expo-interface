import {act, fireEvent, render, screen} from '@testing-library/react';
import {Toast} from '.';

describe('Toast (web)', () => {
  it('announces the message as a live region', () => {
    render(<Toast message="3 files added" visible testID="toast"/>);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('3 files added');
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('shows nothing while it is not visible', () => {
    render(<Toast message="3 files added" visible={false} testID="toast"/>);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('takes its action, and puts itself away when its time is up', () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    vi.useFakeTimers();
    try {
      render(<Toast message="Note deleted" visible action={{label: 'Undo', onPress}} onDismiss={onDismiss}/>);
      fireEvent.click(screen.getByRole('button', {name: 'Undo'}));
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
      act(() => vi.advanceTimersByTime(4000));
      expect(onDismiss).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays up when the duration is zero or less, until something puts it away', () => {
    const onDismiss = vi.fn();
    vi.useFakeTimers();
    try {
      render(<Toast message="Offline" visible duration={0} onDismiss={onDismiss}/>);
      act(() => vi.advanceTimersByTime(60000));
      expect(onDismiss).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent('Offline');
    } finally {
      vi.useRealTimers();
    }
  });
});

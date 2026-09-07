import {StyleSheet} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {Toast} from '.';

describe('Toast (ios)', () => {
  it('draws a raised capsule with the message', async () => {
    await render(<Toast message="Copied" visible testID="toast"/>);
    const toast = screen.getByTestId('toast');
    expect(StyleSheet.flatten(toast.props.style)).toMatchObject({
      backgroundColor: colors.light.backgroundElement,
      borderRadius: 999,
    });
    expect(screen.getByText('Copied')).toBeOnTheScreen();
  });

  it('shows nothing while it is not visible', async () => {
    await render(<Toast message="Copied" visible={false} testID="toast"/>);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('puts itself away when its time is up', async () => {
    const onDismiss = vi.fn();
    vi.useFakeTimers();
    try {
      await render(<Toast message="Copied" visible duration={1000} onDismiss={onDismiss}/>);
      await act(async () => {vi.advanceTimersByTime(999);});
      expect(onDismiss).not.toHaveBeenCalled();
      await act(async () => {vi.advanceTimersByTime(1);});
      expect(onDismiss).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('takes its action and dismisses with it', async () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    await render(
      <Toast message="Note deleted" visible action={{label: 'Undo', onPress}} onDismiss={onDismiss}/>,
    );
    const [undo] = screen.container.queryAll(i => i.props.label === 'Undo');
    await fireEvent(undo, 'buttonPress');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('needs no dismissal handler', async () => {
    vi.useFakeTimers();
    try {
      await render(<Toast message="Copied" visible/>);
      await act(async () => {vi.advanceTimersByTime(5000);});
      expect(screen.getByText('Copied')).toBeOnTheScreen();
    } finally {
      vi.useRealTimers();
    }
  });
});

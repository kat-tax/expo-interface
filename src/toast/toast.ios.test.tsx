import {AccessibilityInfo, StyleSheet} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {colors, spacing} from '../theme';
import {ToastInsetContext} from './context';
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

  it('takes a material, which is the web\'s, and draws the capsule opaque all the same', async () => {
    await render(<Toast message="Copied" visible material="regular" testID="toast"/>);
    const toast = screen.getByTestId('toast');
    expect(StyleSheet.flatten(toast.props.style)).toMatchObject({backgroundColor: colors.light.backgroundElement, borderRadius: 999});
    expect(toast.props.dataSet).toBeUndefined();
  });

  it('tells the screen what it covers of the bottom edge, and nothing once it goes', async () => {
    const report = vi.fn();
    const {rerender} = await render(
      <ToastInsetContext.Provider value={report}>
        <Toast message="Copied" visible testID="toast"/>
      </ToastInsetContext.Provider>,
    );
    // Nothing until the strip is measured.
    expect(report).toHaveBeenLastCalledWith(0);
    await fireEvent(screen.root!, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 44}}});
    // The capsule and the gap under it, which a fab has to clear.
    expect(report).toHaveBeenLastCalledWith(44 + spacing.four);

    await rerender(
      <ToastInsetContext.Provider value={report}>
        <Toast message="Copied" visible={false} testID="toast"/>
      </ToastInsetContext.Provider>,
    );
    expect(report).toHaveBeenLastCalledWith(0);
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

  it('has VoiceOver read its message as it shows and when the message changes, since iOS has no live regions', async () => {
    const announce = vi.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => {});
    try {
      const {rerender} = await render(<Toast message="Copied" visible={false}/>);
      expect(announce).not.toHaveBeenCalled();
      await rerender(<Toast message="Copied" visible/>);
      // Queued, so VoiceOver reads it once it is done speaking, as a polite live region would.
      expect(announce.mock.calls).toEqual([['Copied', {queue: true}]]);
      await rerender(<Toast message="Copied" visible action={{label: 'Undo', onPress: vi.fn()}}/>);
      expect(announce).toHaveBeenCalledTimes(1);
      await rerender(<Toast message="Moved to the bin" visible/>);
      expect(announce.mock.calls.at(-1)).toEqual(['Moved to the bin', {queue: true}]);
      await rerender(<Toast message="Moved to the bin" visible={false}/>);
      expect(announce).toHaveBeenCalledTimes(2);
    } finally {
      announce.mockRestore();
    }
  });

  it('stays up when the duration is zero or less, until something puts it away', async () => {
    const onDismiss = vi.fn();
    vi.useFakeTimers();
    try {
      await render(<Toast message="Offline" visible duration={0} onDismiss={onDismiss}/>);
      await act(async () => {vi.advanceTimersByTime(60000);});
      expect(onDismiss).not.toHaveBeenCalled();
      expect(screen.getByText('Offline')).toBeOnTheScreen();
    } finally {
      vi.useRealTimers();
    }
  });
});

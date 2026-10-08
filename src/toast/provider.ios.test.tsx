import type {ToastApi} from './provider';
import {useContext, useEffect} from 'react';
import {StyleSheet, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {setInsets} from 'vitest-native/helpers';
import {spacing} from '../theme';
import {AppToastInsetContext, useAppToastFloor} from './context';
import {ToastProvider, useToast} from './provider';

/** Hands the provider's toasts to the test, and shows what it says the toast covers. */
let toasts: ToastApi;
function Hand() {
  const api = useToast();
  const covered = useContext(AppToastInsetContext);
  useEffect(() => {
    toasts = api;
  });
  return <Text testID="covered">{String(covered)}</Text>;
}

/** A bar along the bottom edge under the provider, as the native tab bar is: reports what it takes of the edge. */
function Bar({height}: {height: number}) {
  useAppToastFloor(height);
  return null;
}

describe('ToastProvider (ios)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('needs a provider for its toasts', async () => {
    function Lost() {
      useToast();
      return null;
    }
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Lost/>)).rejects.toThrow('useToast needs a ToastProvider above it.');
  });

  it('shows its toasts one at a time, each for its duration, and takes one away on request', async () => {
    await render(<ToastProvider><Hand/></ToastProvider>);
    let second = '';
    await act(async () => {
      toasts.show('Copied');
      second = toasts.show({message: 'Moved to the bin', action: {label: 'Undo', onPress: () => {}}, duration: 6000});
      toasts.show('Saved');
    });
    expect(screen.getByText('Copied')).toBeOnTheScreen();
    expect(screen.queryByText('Moved to the bin')).toBeNull();
    // The one waiting can go before its turn.
    await act(async () => {
      toasts.dismiss(second);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(screen.queryByText('Copied')).toBeNull();
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    // And the one showing, by no id at all.
    await act(async () => {
      toasts.dismiss();
    });
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('tells the screens under it what its toast covers of the bottom edge', async () => {
    await render(<ToastProvider><Hand/></ToastProvider>);
    await act(async () => {
      toasts.show('Copied');
    });
    expect(screen.getByTestId('covered')).toHaveTextContent('0');
    // The toast's strip, once laid out: the capsule and the gap under it.
    const strip = screen.getByText('Copied').parent!.parent!.parent!;
    await fireEvent(strip, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 44}}});
    expect(screen.getByTestId('covered')).toHaveTextContent(String(44 + spacing.four));
    await act(async () => {
      toasts.dismiss();
    });
    expect(screen.getByTestId('covered')).toHaveTextContent('0');
  });

  it('stands its toast on the bottom safe area and on what a bar under it reports', async () => {
    await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 34}));
    try {
      const {rerender} = await render(<ToastProvider><Bar height={50}/><Hand/></ToastProvider>);
      await act(async () => {
        toasts.show('Copied');
      });
      // The area above the home indicator and the bar, whose foot the toast's own slot sits at.
      const floor = () => StyleSheet.flatten(screen.getByTestId('toast-floor').props.style);
      expect(floor()).toMatchObject({position: 'absolute', top: 0, left: 0, right: 0, bottom: 34 + 50, pointerEvents: 'box-none'});
      expect(screen.getByText('Copied')).toBeOnTheScreen();
      // The bar goes (hidden tabs report nothing), and the toast comes down to the safe area.
      await rerender(<ToastProvider><Hand/></ToastProvider>);
      expect(floor().bottom).toBe(34);
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });
});

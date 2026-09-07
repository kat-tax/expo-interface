import type {PropsWithChildren} from 'react';
import type {KeyboardState} from './types';
import {Dimensions, Platform, Text, View} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {colors} from '../theme';
import {KeyboardBar} from '.';

/**
 * A stand-in for `react-native-keyboard-controller`: the keyboard state is a
 * module value the tests drive, the sticky view a plain view that exposes
 * its offset, the provider a marker view.
 */
const keyboard: KeyboardState = {isVisible: false, height: 0};
const listeners = new Set<() => void>();

vi.mock('./library', async () => {
  const {useEffect, useState} = await import('react');
  const {View: RNView} = await import('react-native');
  function useKeyboardState<T>(selector: (state: KeyboardState) => T): T {
    const [, tick] = useState(0);
    useEffect(() => {
      const listener = () => tick(t => t + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);
    return selector(keyboard);
  }
  const KeyboardStickyView = ({children, offset}: PropsWithChildren<{offset?: {closed?: number; opened?: number}}>) => (
    <RNView testID="sticky" accessibilityLabel={`opened ${offset?.opened ?? 'none'}`}>{children}</RNView>
  );
  const KeyboardProvider = ({children}: PropsWithChildren) => <RNView testID="keyboard-provider">{children}</RNView>;
  return {loadKeyboardController: () => ({KeyboardProvider, KeyboardStickyView, useKeyboardState})};
});

async function setKeyboard(state: KeyboardState) {
  await act(async () => {
    Object.assign(keyboard, state);
    for (const listener of listeners) listener();
  });
}

type Measurable = {measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void};

/**
 * The ref the bar measures through is a `View` instance, whose method in the
 * harness is a no-op on a class prototype shared by every view: found
 * through a view of our own, so a test can spy on it.
 */
async function viewPrototype(): Promise<Measurable> {
  let probe: Measurable | null = null;
  await render(<View ref={(ref: unknown) => { probe = ref as Measurable; }}/>);
  return Object.getPrototypeOf(probe!) as Measurable;
}

describe(`KeyboardBar with the keyboard library (${Platform.OS})`, () => {
  afterEach(async () => {
    await setKeyboard({isVisible: false, height: 0});
  });

  it('rides on the keyboard in a sticky view and reports its height', async () => {
    const window = Dimensions.get('window').height;
    const measure = vi.spyOn(await viewPrototype(), 'measureInWindow').mockImplementation(cb => cb(0, window - 100, 0, 60));
    const onKeyboard = vi.fn();
    await render(
      <KeyboardBar onKeyboard={onKeyboard} style={{paddingTop: 4}}>
        <Text testID="bar">Bar</Text>
      </KeyboardBar>,
    );
    const sticky = screen.getByTestId('sticky');
    expect(sticky).toBeOnTheScreen();
    expect(onKeyboard).toHaveBeenLastCalledWith(0);
    const bar = screen.getByTestId('bar').parent!;
    expect(bar.props.style).toEqual(expect.arrayContaining([{backgroundColor: colors.light.background}, {paddingTop: 4}]));

    await setKeyboard({isVisible: true, height: 300});
    expect(onKeyboard).toHaveBeenLastCalledWith(300);
    // While the keyboard is up the bar is not re-measured (it has moved).
    await fireEvent(bar, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 0, height: 0}}});
    expect(measure).not.toHaveBeenCalled();
    expect(screen.getByLabelText('opened 0')).toBeOnTheScreen();

    // Once it is away the bar measures what lies under it in the window.
    await setKeyboard({isVisible: false, height: 300});
    expect(onKeyboard).toHaveBeenLastCalledWith(0);
    await fireEvent(bar, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 0, height: 0}}});
    expect(measure).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('opened 40')).toBeOnTheScreen();
    measure.mockRestore();
  });

  it('works without a listener', async () => {
    await render(
      <KeyboardBar>
        <View testID="bar"/>
      </KeyboardBar>,
    );
    await setKeyboard({isVisible: true, height: 100});
    expect(screen.getByTestId('bar')).toBeOnTheScreen();
  });

  it('mounts the keyboard provider under the accent provider', async () => {
    await render(
      <AccentProvider>
        <Text>Child</Text>
      </AccentProvider>,
    );
    expect(screen.getByTestId('keyboard-provider')).toBeOnTheScreen();
    expect(screen.getByText('Child')).toBeOnTheScreen();
  });
});

import {Platform, StyleSheet, Text} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {loadKeyboardController} from './library';
import {KeyboardBar} from '.';

/**
 * `react-native-keyboard-controller` is not installed in the kit itself, so
 * this covers the fallback; keyboard.library.native.test.tsx mocks the
 * library in.
 */
describe(`KeyboardBar without the keyboard library (${Platform.OS})`, () => {
  it('loads no library', () => {
    expect(loadKeyboardController()).toBeNull();
  });

  it('renders a plain opaque view around its content', async () => {
    const onKeyboard = vi.fn();
    await render(
      <KeyboardBar onKeyboard={onKeyboard} style={{paddingTop: 4}}>
        <Text testID="bar">Bar</Text>
      </KeyboardBar>,
    );
    const bar = screen.getByTestId('bar');
    expect(StyleSheet.flatten(bar.parent?.props.style)).toMatchObject({backgroundColor: colors.light.background, paddingTop: 4});
    expect(onKeyboard).not.toHaveBeenCalled();
  });
});

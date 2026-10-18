import {Text} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {theme} from '../theme';
import {loadKeyboardController} from './library';
import {KeyboardBar} from '.';

/** The fallback, which is all web has: it never loads `react-native-keyboard-controller`. */
describe('KeyboardBar without the keyboard library (web)', () => {
  it('loads no library', () => {
    expect(loadKeyboardController()).toBeNull();
  });

  it('renders a plain opaque view around its content', () => {
    const onKeyboard = vi.fn();
    renderDom(
      <KeyboardBar onKeyboard={onKeyboard}>
        <Text testID="bar">Bar</Text>
      </KeyboardBar>,
    );
    const bar = dom.getByTestId('bar');
    expect(getComputedStyle(bar.parentElement!).backgroundColor).toBe(theme.background);
    expect(onKeyboard).not.toHaveBeenCalled();
  });
});

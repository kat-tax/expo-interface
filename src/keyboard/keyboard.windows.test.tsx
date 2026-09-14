import {render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {colors} from '../theme';
import {loadKeyboardController} from './library';
import {KeyboardBar} from '.';

describe('KeyboardBar (windows)', () => {
  it('loads no keyboard library', () => {
    expect(loadKeyboardController()).toBeNull();
  });

  it('is a plain view in the background color', async () => {
    await render(
      <KeyboardBar style={{padding: 4}}>
        <Text>Tools</Text>
      </KeyboardBar>,
    );
    expect(screen.getByText('Tools').parent).toHaveStyle({backgroundColor: colors.light.background, padding: 4});
  });
});

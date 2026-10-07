import {createElement} from 'react';
import {Platform} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {icon} from '../icons';
import {colors} from '../theme';
import {Icon} from '.';

// `SymbolView` as a host view carrying its props, so a test reads what the
// kit handed it: the glyph itself is `expo-symbols`' business on both
// platforms, and Android's draws nothing until its font has loaded.
vi.mock('expo-symbols', () => ({SymbolView: (props: object) => createElement('SymbolView', props)}));

const symbol = (testID: string) => screen.getByTestId(testID).props;

describe(`Icon (${Platform.OS})`, () => {
  it('draws the token through SymbolView, the solid form on iOS for a filled token', async () => {
    await render(
      <>
        <Icon icon={icons.share} testID="share"/>
        <Icon icon={icons.starFilled} size={16} testID="star"/>
      </>,
    );
    expect(symbol('share').name).toEqual({ios: 'square.and.arrow.up', android: 'share'});
    expect(symbol('star').name).toEqual({ios: 'star.fill', android: 'star'});
    expect(symbol('star').size).toBe(16);
    expect(symbol('star').style).toEqual({width: 16, height: 16});
  });

  it('draws in a tone, the label color by default, and in a color of its own over it', async () => {
    await render(
      <>
        <Icon icon={icons.share} testID="plain"/>
        <Icon icon={icons.share} tone="success" testID="success"/>
        <Icon icon={icons.share} tone="success" tintColor="#123456" testID="own"/>
      </>,
    );
    expect(symbol('plain').tintColor).toBe(colors.light.label);
    expect(symbol('success').tintColor).toBe(colors.light.success);
    expect(symbol('own').tintColor).toBe('#123456');
  });

  it('stays out of the accessibility tree, since the control around it carries the name', async () => {
    await render(<Icon icon={icons.share} testID="share"/>);
    expect(symbol('share').accessible).toBe(false);
    expect(symbol('share').importantForAccessibility).toBe('no');
  });

  it('draws a bare SF Symbol name on iOS alone, and nothing for a token naming neither', async () => {
    await render(
      <>
        <Icon icon={icon('star')} testID="bare"/>
        <Icon icon={{symbol: {web: 'home'} as never}} testID="none"/>
      </>,
    );
    expect(symbol('bare').name).toEqual({ios: 'star', android: undefined});
    expect(screen.queryByTestId('none')).toBeNull();
  });
});

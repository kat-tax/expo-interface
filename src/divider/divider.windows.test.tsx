import {render, screen} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {colors} from '../theme';
import {Divider} from '.';

describe('Divider (windows)', () => {
  it('draws a hairline in the separator color', async () => {
    await render(<Divider testID="rule"/>);
    const rule = screen.getByTestId('rule');
    expect(rule.props['aria-orientation']).toBe('horizontal');
    expect(rule).toHaveStyle({height: StyleSheet.hairlineWidth, backgroundColor: colors.light.separator});
  });

  it('draws a vertical rule with an inset and a color of its own', async () => {
    await render(<Divider vertical color="#FF0000" inset={12} testID="rule"/>);
    const rule = screen.getByTestId('rule');
    expect(rule.props['aria-orientation']).toBe('vertical');
    expect(rule).toHaveStyle({width: StyleSheet.hairlineWidth, backgroundColor: '#FF0000', marginTop: 12});
  });

  it('insets a horizontal rule from the leading edge', async () => {
    await render(<Divider inset={16} testID="rule"/>);
    expect(screen.getByTestId('rule')).toHaveStyle({marginLeft: 16});
  });
});

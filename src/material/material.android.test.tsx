import {render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {colors} from '../theme';
import {Material} from '.';

const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe('Material (android)', () => {
  it('draws the children on the screen fill, opaque, with no hairline by default', async () => {
    await render(
      <Material testID="material">
        <Text>Over</Text>
      </Material>,
    );
    expect(style('material')).toMatchObject({backgroundColor: colors.light.background});
    expect(style('material').borderTopWidth).toBeUndefined();
    expect(screen.getByText('Over')).toBeOnTheScreen();
  });

  it('takes the raised fill, a radius and a hairline, whatever the thickness', async () => {
    await render(<Material kind="glass" fill="element" radius={16} edge="top" testID="material"/>);
    expect(style('material')).toMatchObject({
      backgroundColor: colors.light.backgroundElement,
      borderRadius: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.light.separator,
    });
  });
});

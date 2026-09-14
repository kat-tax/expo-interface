import {render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {Toolbar} from '.';

describe('Toolbar (windows)', () => {
  it('draws the controls in React Native rows with a rule on the content edge', async () => {
    await render(
      <Toolbar leading={<Text>Bold</Text>} trailing={<Text>Share</Text>} testID="bar">
        <Text>Second row</Text>
      </Toolbar>,
    );
    const bar = screen.getByTestId('bar');
    expect(bar).toHaveStyle({borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16});
    for (const text of ['Bold', 'Share', 'Second row']) expect(screen.getByText(text)).toBeOnTheScreen();
  });

  it('puts the rule on the bottom of a top bar and packs a compact bar tighter', async () => {
    await render(<Toolbar placement="top" density="compact" leading={<Text>Bold</Text>} testID="bar"/>);
    expect(screen.getByTestId('bar')).toHaveStyle({borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8});
    expect(screen.getByText('Bold').parent).toHaveStyle({gap: 2});
  });

  it('grows a field into the space between the groups', async () => {
    await render(<Toolbar field={<Text testID="field">Search</Text>} testID="bar"/>);
    expect(screen.getByTestId('field').parent).toHaveStyle({flex: 1});
  });
});

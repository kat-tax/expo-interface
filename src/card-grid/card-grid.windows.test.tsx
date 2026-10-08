import {StyleSheet, Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {CardGrid} from '.';

const items = ['A', 'B', 'C', 'D', 'E'];

/** The width the grid reports, which decides its columns. */
async function layout(width: number) {
  const handler = screen.getByTestId('grid').props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout: {width, height: 600, x: 0, y: 0}}}));
}

describe('CardGrid (windows)', () => {
  it('is a FlatList of rows cut from the measured width, measuring its rows whatever the estimate', async () => {
    await render(
      <CardGrid data={items} renderItem={item => <Text>{item}</Text>} keyExtractor={item => item} minItemWidth={150} gap={12} estimatedItemHeight={100} testID="grid"/>,
    );
    for (const item of items) expect(screen.getByText(item)).toBeOnTheScreen();
    // A narrow window: two columns, the last row with a filler cell the width of the others.
    await layout(390);
    const grid = screen.getByTestId('grid');
    expect(grid.props.data).toEqual([['A', 'B'], ['C', 'D'], ['E']]);
    expect(screen.getByText('E').parent!.parent!.children).toHaveLength(2);
    // No row height given to the list: the web's estimate is not the cards' height.
    expect(grid.props.getItemLayout).toBeUndefined();
    await layout(1200);
    expect(screen.getByTestId('grid').props.data).toEqual([['A', 'B', 'C', 'D'], ['E']]);
  });

  it('keeps a tap on a card while a field has the touch keyboard, and lets the empty state fill the grid', async () => {
    await render(<CardGrid data={[]} renderItem={() => null} empty={<Text>Nothing yet</Text>} testID="grid"/>);
    const grid = screen.getByTestId('grid');
    expect(screen.getByText('Nothing yet')).toBeOnTheScreen();
    expect(grid.props.keyboardShouldPersistTaps).toBe('handled');
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toMatchObject({flexGrow: 1});
  });
});

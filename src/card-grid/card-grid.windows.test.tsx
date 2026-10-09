import {useEffect} from 'react';
import {StyleSheet, Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {nodes} from 'expo-vitest/native';
import {CardGrid} from '.';

const items = ['A', 'B', 'C', 'D', 'E'];

/** The width the grid reports, which decides its columns. */
async function layout(width: number) {
  const handler = screen.getByTestId('grid').props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout: {width, height: 600, x: 0, y: 0}}}));
}

/** The separators the list draws between the rows: a view the gap tall. */
const separators = (gap: number) => nodes().filter(n => n.type === 'RCTView' && StyleSheet.flatten(n.props.style)?.height === gap);

describe('CardGrid (windows)', () => {
  it('keeps its list, and the cells that stay in their row, through a change of columns, with one separator component', async () => {
    const mounts: Record<string, number> = {};
    function Cell({item}: {item: string}) {
      useEffect(() => {
        mounts[item] = (mounts[item] ?? 0) + 1;
      }, [item]);
      return <Text>{item}</Text>;
    }
    const cell = (item: string) => <Cell item={item}/>;
    const {rerender} = await render(<CardGrid data={items} renderItem={cell} keyExtractor={item => item} gap={10} testID="grid"/>);
    await layout(390);
    const grid = screen.getByTestId('grid');
    const separator = grid.props.ItemSeparatorComponent;
    expect(mounts).toEqual({A: 1, B: 1, C: 1, D: 1, E: 1});
    // Two separators between three rows, each the gap tall.
    expect(separators(10)).toHaveLength(2);
    // Two columns to four: the same list, scrolled where it was, with the rows cut again as new data.
    await layout(1200);
    expect(screen.getByTestId('grid')).toBe(grid);
    expect(screen.getByTestId('grid').props.data).toEqual([['A', 'B', 'C', 'D'], ['E']]);
    // The cells that kept their row kept their views; C and D moved up into the first row.
    expect(mounts).toEqual({A: 1, B: 1, C: 2, D: 2, E: 1});
    // One separator component through every render, reading the gap from the grid.
    await rerender(<CardGrid data={items} renderItem={cell} keyExtractor={item => item} gap={20} testID="grid"/>);
    expect(screen.getByTestId('grid').props.ItemSeparatorComponent).toBe(separator);
    expect(separators(20)).toHaveLength(1);
    expect(separators(10)).toHaveLength(0);
  });

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

  it('pads the sides inside the scroller, and counts the columns from the width between them', async () => {
    await render(<CardGrid data={items} renderItem={item => <Text>{item}</Text>} contentInset={{left: 300, right: 300}} testID="grid"/>);
    await layout(1200);
    const grid = screen.getByTestId('grid');
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toEqual({paddingTop: 0, paddingBottom: 0, paddingLeft: 300, paddingRight: 300});
    // 600 between the insets: three columns of 150, where 1200 holds four.
    expect(grid.props.data).toEqual([['A', 'B', 'C'], ['D', 'E']]);
  });
});

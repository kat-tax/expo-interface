import {useEffect} from 'react';
import {Platform, StyleSheet, Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {ScrollInsetsContext} from '../screen/insets';
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

describe(`CardGrid (${Platform.OS})`, () => {
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

  it('cuts the cells into rows of as many columns as the width holds', async () => {
    await render(
      <CardGrid data={items} renderItem={item => <Text>{item}</Text>} keyExtractor={item => item} minItemWidth={150} gap={12} testID="grid"/>,
    );
    for (const item of items) expect(screen.getByText(item)).toBeOnTheScreen();
    // Two columns at a phone's width: three rows, the last one with a filler cell the width of the others.
    await layout(390);
    const rows = screen.getByTestId('grid').props.data as string[][];
    expect(rows).toEqual([['A', 'B'], ['C', 'D'], ['E']]);
    const last = screen.getByText('E').parent!.parent!;
    expect(last.children).toHaveLength(2);
    expect(StyleSheet.flatten(last.props.style)).toMatchObject({flexDirection: 'row', gap: 12});
    // Four at a desk's.
    await layout(1200);
    expect(screen.getByTestId('grid').props.data).toEqual([['A', 'B', 'C', 'D'], ['E']]);
  });

  it('keys its rows by the first cell, or by the row index, and hands the end to the list, which measures its rows', async () => {
    const onEndReached = vi.fn();
    await render(<CardGrid data={items} renderItem={item => <Text>{item}</Text>} keyExtractor={item => `item-${item}`} maxColumns={2} onEndReached={onEndReached} estimatedItemHeight={100} testID="grid"/>);
    await layout(600);
    const grid = screen.getByTestId('grid');
    expect(grid.props.keyExtractor(['C', 'D'], 1)).toBe('item-C');
    expect(grid.props.onEndReached).toBe(onEndReached);
    // No row height given to the list: the web's estimate is not the cards' height.
    expect(grid.props.getItemLayout).toBeUndefined();
    await render(<CardGrid data={items} renderItem={item => <Text>{item}</Text>} testID="plain"/>);
    expect(screen.getByTestId('plain').props.keyExtractor(['A'], 0)).toBe('0');
  });

  it('puts the header before the cells and the footer after, and the empty state in place of none', async () => {
    await render(
      <CardGrid data={[]} renderItem={() => null} header={<Text>Header</Text>} footer={<Text>Footer</Text>} empty={<Text>Nothing yet</Text>} testID="grid"/>,
    );
    expect(screen.getByText('Nothing yet')).toBeOnTheScreen();
    expect(screen.getByText('Header')).toBeOnTheScreen();
    expect(screen.getByText('Footer')).toBeOnTheScreen();
    await render(<CardGrid data={['One']} renderItem={item => <Text>{item}</Text>} testID="bare"/>);
    expect(screen.getByTestId('bare').props.ListEmptyComponent).toBeUndefined();
    expect(screen.getByTestId('bare').props.ListHeaderComponent).toBeUndefined();
  });

  it('keeps a tap on a card while a field has the keyboard, and lets the empty state fill the grid', async () => {
    await render(<CardGrid data={[]} renderItem={() => null} empty={<Text>Nothing yet</Text>} testID="grid"/>);
    const grid = screen.getByTestId('grid');
    expect(grid.props.keyboardShouldPersistTaps).toBe('handled');
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toMatchObject({flexGrow: 1});
  });

  it('pads its content and its scroll indicators by the screen\'s bar and its own insets', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 100, bottom: 0, left: 0, right: 0, automatic: false}}>
        <CardGrid data={items} renderItem={item => <Text>{item}</Text>} contentInset={{top: 8, bottom: 20}} gap={0} testID="grid"/>
      </ScrollInsetsContext.Provider>,
    );
    const grid = screen.getByTestId('grid');
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toEqual({paddingTop: 108, paddingBottom: 20, paddingLeft: 0, paddingRight: 0});
    expect(grid.props.scrollIndicatorInsets).toEqual({top: 108, bottom: 20});
    expect(grid.props.contentInsetAdjustmentBehavior).toBeUndefined();
  });

  it('takes UIKit\'s own inset where the platform insets the content under the header itself', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 40, bottom: 0, left: 0, right: 0, automatic: true}}>
        <CardGrid data={items} renderItem={item => <Text>{item}</Text>} testID="grid"/>
      </ScrollInsetsContext.Provider>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.props.contentInsetAdjustmentBehavior).toBe('automatic');
    // What UIKit does not know of, a row floating under the header, is the grid's own.
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toMatchObject({paddingTop: 40});
  });

  it('pads the sides inside the scroller, and counts the columns from the width between them', async () => {
    await render(<CardGrid data={items} renderItem={item => <Text>{item}</Text>} contentInset={{left: 300, right: 300}} testID="grid"/>);
    await layout(1200);
    const grid = screen.getByTestId('grid');
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toEqual({paddingTop: 0, paddingBottom: 0, paddingLeft: 300, paddingRight: 300});
    // 600 between the insets: three columns of 150, where 1200 holds four.
    expect(grid.props.data).toEqual([['A', 'B', 'C'], ['D', 'E']]);
    // The indicators keep to the grid's edges.
    expect(grid.props.scrollIndicatorInsets).toEqual({top: 0, bottom: 0});
  });
});

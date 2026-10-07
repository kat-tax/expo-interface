import {Platform, StyleSheet, Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {ScrollInsetsContext} from '../screen/insets';
import {CardGrid} from '.';

const items = ['A', 'B', 'C', 'D', 'E'];

/** The width the grid reports, which decides its columns. */
async function layout(width: number) {
  const handler = screen.getByTestId('grid').props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout: {width, height: 600, x: 0, y: 0}}}));
}

describe(`CardGrid (${Platform.OS})`, () => {
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

  it('keys its rows by the first cell, or by the row index, and hands the end to the list', async () => {
    const onEndReached = vi.fn();
    await render(<CardGrid data={items} renderItem={item => <Text>{item}</Text>} keyExtractor={item => `item-${item}`} maxColumns={2} onEndReached={onEndReached} testID="grid"/>);
    await layout(600);
    const grid = screen.getByTestId('grid');
    expect(grid.props.keyExtractor(['C', 'D'], 1)).toBe('item-C');
    expect(grid.props.onEndReached).toBe(onEndReached);
    expect(grid.props.getItemLayout(null, 2)).toEqual({length: 192, offset: 384, index: 2});
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

  it('pads its content and its scroll indicators by the screen\'s bar and its own insets', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 100, bottom: 0, automatic: false}}>
        <CardGrid data={items} renderItem={item => <Text>{item}</Text>} contentInset={{top: 8, bottom: 20}} estimatedItemHeight={100} gap={0} testID="grid"/>
      </ScrollInsetsContext.Provider>,
    );
    const grid = screen.getByTestId('grid');
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toEqual({paddingTop: 108, paddingBottom: 20});
    expect(grid.props.scrollIndicatorInsets).toEqual({top: 108, bottom: 20});
    expect(grid.props.contentInsetAdjustmentBehavior).toBeUndefined();
    expect(grid.props.getItemLayout(null, 1)).toEqual({length: 100, offset: 100, index: 1});
  });

  it('takes UIKit\'s own inset where the platform insets the content under the header itself', async () => {
    await render(
      <ScrollInsetsContext.Provider value={{top: 40, bottom: 0, automatic: true}}>
        <CardGrid data={items} renderItem={item => <Text>{item}</Text>} testID="grid"/>
      </ScrollInsetsContext.Provider>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.props.contentInsetAdjustmentBehavior).toBe('automatic');
    // What UIKit does not know of, a row floating under the header, is the grid's own.
    expect(StyleSheet.flatten(grid.props.contentContainerStyle)).toMatchObject({paddingTop: 40});
  });
});

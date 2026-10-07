import {StyleSheet, Text} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {ListItem} from '../list-item';
import {ScrollInsetsContext} from '../screen/insets';
import {colors} from '../theme';
import {List} from '.';

const rows = ['Essay', 'Notes', 'Sketch'];

describe('List (windows)', () => {
  it('is a windowed FlatList of the rows with hairlines between them', async () => {
    await render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} keyExtractor={title => title} testID="list"/>);
    for (const title of rows) expect(screen.getByText(title)).toBeOnTheScreen();
    const list = screen.getByTestId('list');
    expect(list.props.getItemLayout(null, 2)).toEqual({length: 56, offset: 112, index: 2});
    // A hairline in the separator color between the rows.
    const separator = list.props.ItemSeparatorComponent();
    expect(StyleSheet.flatten(separator.props.style)).toMatchObject({height: StyleSheet.hairlineWidth, backgroundColor: colors.light.separator});
  });

  it('drops the hairlines when asked, and takes a row height of the app\'s own', async () => {
    await render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} separators={false} estimatedItemHeight={72} testID="list"/>);
    const list = screen.getByTestId('list');
    expect(list.props.ItemSeparatorComponent).toBeUndefined();
    expect(list.props.getItemLayout(null, 1)).toEqual({length: 72, offset: 72, index: 1});
  });

  it('puts the header before the rows and the footer after, and the empty state in place of no rows', async () => {
    await render(
      <List data={[]} renderItem={() => null} header={<Text>Header</Text>} empty={<Text>Nothing yet</Text>} footer={<Text>Footer</Text>} testID="list"/>,
    );
    expect(screen.getByText('Nothing yet')).toBeOnTheScreen();
    expect(screen.getByText('Header')).toBeOnTheScreen();
    expect(screen.getByText('Footer')).toBeOnTheScreen();
    await render(<List data={['One']} renderItem={title => <ListItem>{title}</ListItem>} testID="bare"/>);
    expect(screen.getByTestId('bare').props.ListHeaderComponent).toBeUndefined();
    expect(screen.getByTestId('bare').props.ListEmptyComponent).toBeUndefined();
  });

  it('hands the end to the list, and pads its content by the screen\'s bar and its own insets', async () => {
    const onEndReached = vi.fn();
    await render(
      <ScrollInsetsContext.Provider value={{top: 100, bottom: 0, automatic: false}}>
        <List data={rows} renderItem={title => <ListItem>{title}</ListItem>} onEndReached={onEndReached} contentInset={{top: 8, bottom: 20}} testID="list"/>
      </ScrollInsetsContext.Provider>,
    );
    const list = screen.getByTestId('list');
    expect(list.props.onEndReached).toBe(onEndReached);
    expect(StyleSheet.flatten(list.props.contentContainerStyle)).toEqual({paddingTop: 108, paddingBottom: 20});
  });
});

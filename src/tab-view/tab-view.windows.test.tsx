import {Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {TabView, tabItems} from './index.windows';

const XAML = 'ExpoInterfaceTabView';

const TABS = [
  {id: 'a', title: 'Notes', icon: {symbol: {ios: 'doc', android: 'description', web: 'description'}}} as const,
  {id: 'b', title: 'Sketch'},
  {id: 'c', title: 'Readme', pinned: true},
];

async function layout(width: number) {
  const handler = screen.getByTestId('t').props.onLayout as (payload: unknown) => void;
  await act(async () => handler({nativeEvent: {layout: {width, height: 400}}}));
}

describe('TabView (windows)', () => {
  it('puts a real TabView above the page, as the strip alone', async () => {
    await render(
      <TabView tabs={TABS} selected="b" onSelect={() => {}} onClose={() => {}} onAdd={() => {}} label="Files" layout="strip" testID="t">
        <Text>Page of B</Text>
      </TabView>,
    );
    expect(island(XAML).props).toMatchObject({
      selectedIndex: 1,
      addButton: true,
      // The island names its own XAML control; accessibilityLabel would only
      // reach the React view wrapping it.
      label: 'Files',
      theme: 'light',
      testID: 't-strip',
    });
    // The island is the strip and nothing else: the page under it is the
    // kit's own React Native, because content inside an island would have to
    // be XAML.
    expect(screen.getByText('Page of B')).toBeOnTheScreen();
  });

  it('hands the tabs over as JSON, with a Fluent glyph and the crosses that apply', () => {
    expect(JSON.parse(tabItems(TABS, true))).toEqual([
      {title: 'Notes', glyph: 'E8A5', closable: true},
      {title: 'Sketch', glyph: null, closable: true},
      // Pinned keeps its place — the index is how a selection comes back —
      // and simply shows no cross.
      {title: 'Readme', glyph: null, closable: false},
    ]);
    expect(JSON.parse(tabItems(TABS, false)).every((tab: {closable: boolean}) => !tab.closable)).toBe(true);
  });

  it('takes the control selection as a request for that tab, and ignores the one already open', async () => {
    const onSelect = vi.fn();
    await render(<TabView tabs={TABS} selected="a" onSelect={onSelect} layout="strip" testID="t"/>);
    await fireIsland(island(XAML), 'selectionChange', {index: 1});
    expect(onSelect).toHaveBeenCalledWith('b');
    await fireIsland(island(XAML), 'selectionChange', {index: 0});
    expect(onSelect).toHaveBeenCalledTimes(1);
    // An index past the end is a tab that has just gone; nothing is reported.
    await fireIsland(island(XAML), 'selectionChange', {index: 9});
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('reports a close from the control, and shrugs at one for a tab that has gone', async () => {
    const onClose = vi.fn();
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} onClose={onClose} layout="strip" testID="t"/>);
    await fireIsland(island(XAML), 'tabClose', {index: 1});
    expect(onClose).toHaveBeenCalledWith('b');
    await fireIsland(island(XAML), 'tabClose', {index: 9});
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves a close alone when the caller does not close tabs', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    expect(island(XAML).props.addButton).toBe(false);
    await fireIsland(island(XAML), 'tabClose', {index: 1});
  });

  it('reports the add button, and shrugs without a handler for it', async () => {
    const onAdd = vi.fn();
    const {rerender} = await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    await fireIsland(island(XAML), 'addTab', {});
    expect(onAdd).not.toHaveBeenCalled();
    await rerender(<TabView tabs={TABS} selected="a" onSelect={() => {}} onAdd={onAdd} layout="strip" testID="t"/>);
    await fireIsland(island(XAML), 'addTab', {});
    expect(onAdd).toHaveBeenCalled();
  });

  it('puts the first tab at the front when the selected id names none', async () => {
    await render(<TabView tabs={TABS} selected="gone" onSelect={() => {}} layout="strip" testID="t"/>);
    expect(island(XAML).props.selectedIndex).toBe(0);
  });

  it('falls back to the drawn switcher in a narrow window, where WinUI has no control either', async () => {
    await render(
      <TabView tabs={TABS} selected="a" onSelect={() => {}} testID="t">
        <Text>Page of A</Text>
      </TabView>,
    );
    await layout(1000);
    expect(islands(XAML)).toHaveLength(1);
    await layout(480);
    expect(islands(XAML)).toHaveLength(0);
    expect(screen.getByLabelText('Notes, 3 tabs')).toBeOnTheScreen();
    expect(screen.getByText('Page of A')).toBeOnTheScreen();
  });

  it('numbers the drawn cards within their set, which only Windows can say', async () => {
    await render(
      <TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>,
    );
    await fireEvent.press(screen.getByTestId('t-switcher'));
    // Narrator says "2 of 3"; nothing else in the suite or in axe can see it,
    // and the harness tree prints it.
    expect(screen.getByTestId('t-card-b').props).toMatchObject({
      accessibilityPosInSet: 2,
      accessibilitySetSize: 3,
      // Named explicitly: react-native-windows composes no name from the text
      // inside a view, so without this the tab announces its position alone.
      accessibilityLabel: 'Sketch',
    });
  });

  it('needs no testID to draw', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip"/>);
    expect(island(XAML).props.testID).toBeUndefined();
  });
});

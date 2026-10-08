import {Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {island} from 'expo-vitest/windows';
import {TabView, tabItems} from './index.windows';

const TABS = [
  {id: 'a', title: 'Notes', menu: [{label: 'Rename'}, {label: 'Close others'}]},
  {id: 'b', title: 'Sketch', depth: 1, accessory: <Text>typing</Text>},
];

describe('TabView tab menus and depth (windows)', () => {
  it('hands the island each tab\'s depth and whether it has a menu', () => {
    expect(JSON.parse(tabItems(TABS, false))).toEqual([
      {title: 'Notes', glyph: null, closable: false, depth: 0, menu: true},
      {title: 'Sketch', glyph: null, closable: false, depth: 1, menu: false},
    ]);
    expect(JSON.parse(tabItems([{id: 'c', title: 'Empty', menu: []}], false))[0].menu).toBe(false);
  });

  it('opens the kit\'s menu where the island reports a right click on a tab, and ignores one on a tab without', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    const flyout = () => island('ExpoInterfaceMenuFlyout');
    expect(flyout().props.open).toBe(false);
    await fireEvent(screen.getByTestId('t-strip'), 'tabMenu', {nativeEvent: {index: 1, x: 10, y: 20}});
    expect(flyout().props.open).toBe(false);
    await fireEvent(screen.getByTestId('t-strip'), 'tabMenu', {nativeEvent: {index: 0, x: 120, y: 36}});
    expect(flyout().props).toMatchObject({open: true, atPoint: true, x: 120, y: 36});
    expect(JSON.parse(flyout().props.items).map((item: {label: string}) => item.label)).toEqual(['Rename', 'Close others']);
    await fireEvent(screen.getByTestId('t-menu'), 'openChange', {nativeEvent: {open: false}});
    expect(flyout().props.open).toBe(false);
  });
});

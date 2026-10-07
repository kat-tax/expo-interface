import {Platform, StyleSheet, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {host} from 'expo-vitest/native';
import {DEPTH_INDENT} from './draw';
import {TabView} from '.';

const isIOS = Platform.OS === 'ios';
const rename = vi.fn();
const TABS = [
  {id: 'a', title: 'Notes', menu: [{label: 'Rename', onPress: rename}, {label: 'Close others'}]},
  {id: 'b', title: 'Sketch', depth: 1, accessory: <Text>typing</Text>},
  {id: 'c', title: 'Readme', depth: 2},
];

/** Where a tab says it is, which the menu opens under. */
async function laidOut(testID: string, layout: {x: number; y: number; width: number; height: number}) {
  const node = screen.getByTestId(testID).parent!;
  await act(async () => node.props.onLayout({nativeEvent: {layout}}));
}

/** Whether the strip's menu is open, and where. */
function menuOpen(): boolean {
  return isIOS
    ? screen.getByTestId('t-menu').props.isPresented
    : host(p => typeof p.expanded === 'boolean').props.expanded;
}

describe(`TabView tab menus, depth and accessories (${Platform.OS})`, () => {
  it('indents a nested tab by its depth, and draws an accessory after the title', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    const sketch = screen.getByTestId('t-tab-b').parent!;
    expect(StyleSheet.flatten(sketch.props.style).paddingLeft).toBe(16 + DEPTH_INDENT);
    expect(StyleSheet.flatten(screen.getByTestId('t-tab-c').parent!.props.style).paddingLeft).toBe(16 + 2 * DEPTH_INDENT);
    expect(StyleSheet.flatten(screen.getByTestId('t-tab-a').parent!.props.style).paddingLeft).toBe(16);
    expect(screen.getByText('typing')).toBeOnTheScreen();
  });

  it('opens a tab\'s menu under the tab on a long press, from the tab\'s layout less the strip\'s scroll', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    expect(menuOpen()).toBe(false);
    await laidOut('t-tab-a', {x: 100, y: 0, width: 120, height: 48});
    const strip = screen.getByTestId('t-strip');
    await act(async () => strip.props.onScroll({nativeEvent: {contentOffset: {x: 30, y: 0}}}));
    await fireEvent(screen.getByTestId('t-tab-a'), 'longPress');
    expect(menuOpen()).toBe(true);
    // The one popup serves every tab: anchored under this one.
    const anchor = host(p => p.matchContentsVertical !== undefined && StyleSheet.flatten(p.style)?.position === 'absolute');
    expect(StyleSheet.flatten(anchor.props.style)).toMatchObject({left: 70, top: 48});
    expect(host(p => p.text === 'Rename' || p.label === 'Rename')).toBeTruthy();
    // Dismissed by the platform: the popup closes and the strip forgets it.
    if (isIOS) {
      await fireEvent(screen.getByTestId('t-menu'), 'isPresentedChange', {nativeEvent: {isPresented: false}});
    } else {
      const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
      await fireEvent(menu, 'dismissRequest');
    }
    expect(menuOpen()).toBe(false);
  });

  it('opens nothing for a tab without a menu, or before the tab has been laid out', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    await fireEvent(screen.getByTestId('t-tab-b'), 'longPress');
    expect(menuOpen()).toBe(false);
    await fireEvent(screen.getByTestId('t-tab-a'), 'longPress');
    expect(menuOpen()).toBe(false);
  });

  it('opens a card\'s menu in the switcher, and indents a nested card', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>);
    await fireEvent.press(screen.getByTestId('t-switcher'));
    expect(StyleSheet.flatten(screen.getByTestId('t-card-b').props.style).paddingLeft).toBe(16 + DEPTH_INDENT);
    expect(screen.getByText('typing')).toBeOnTheScreen();
    const card = screen.getByTestId('t-card-a').parent!;
    await act(async () => card.props.onLayout({nativeEvent: {layout: {x: 16, y: 16, width: 160, height: 60}}}));
    await fireEvent(screen.getByTestId('t-card-a'), 'longPress');
    expect(menuOpen()).toBe(true);
  });
});

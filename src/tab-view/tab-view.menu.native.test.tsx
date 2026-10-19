import {Platform, StyleSheet, Text} from 'react-native';
import {act, fireEvent, isHiddenFromAccessibility, render, screen} from '@testing-library/react-native';
import {host, modifier} from 'expo-vitest/native';
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
    ? screen.getByTestId('t-menu', {includeHiddenElements: true}).props.isPresented
    : host(p => typeof p.expanded === 'boolean').props.expanded;
}

describe(`TabView tab menus, depth and accessories (${Platform.OS})`, () => {
  it('indents a nested tab by its depth, and draws an accessory after the title', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    const sketch = screen.getByTestId('t-tab-b').parent!;
    expect(StyleSheet.flatten(sketch.props.style).paddingLeft).toBe(16 + DEPTH_INDENT);
    expect(StyleSheet.flatten(screen.getByTestId('t-tab-c').parent!.props.style).paddingLeft).toBe(16 + 2 * DEPTH_INDENT);
    expect(StyleSheet.flatten(screen.getByTestId('t-tab-a').parent!.props.style).paddingLeft).toBe(16);
    // Drawn, and hidden from assistive technology: the tab speaks for it.
    expect(screen.getByText('typing', {includeHiddenElements: true})).toBeOnTheScreen();
  });

  it('stands a nested tab of the accent strip off by its depth rather than padding its button', async () => {
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" fill="accent" testID="t"/>);
    const shell = (id: string) => StyleSheet.flatten(screen.getByTestId(`t-tab-${id}`).parent!.props.style);
    expect(shell('b').marginLeft).toBe(DEPTH_INDENT);
    expect(shell('c').marginLeft).toBe(2 * DEPTH_INDENT);
    expect(shell('b').paddingLeft).toBe(shell('a').paddingLeft);
    expect(shell('a').marginLeft).toBeUndefined();
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
      await fireEvent(screen.getByTestId('t-menu', {includeHiddenElements: true}), 'isPresentedChange', {nativeEvent: {isPresented: false}});
    } else {
      const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
      await fireEvent(menu, 'dismissRequest');
    }
    expect(menuOpen()).toBe(false);
  });

  it('keeps the menu\'s anchor, a point with nothing to act on, from the screen reader, in the strip and the switcher', async () => {
    /** The host the menu's testID is on: SwiftUI's popover, or the Compose box it anchors to. */
    const anchor = () => screen.container.queryAll(i => typeof i.type === 'string' && (isIOS ? i.props.testID : modifier(i.props, 'testID')?.testID) === 't-menu')[0];
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="strip" testID="t"/>);
    expect(isHiddenFromAccessibility(anchor())).toBe(true);
    // Hidden whole, and laid over the strip without taking its touches.
    const cover = host(p => p.importantForAccessibility === 'no-hide-descendants' && StyleSheet.flatten(p.style)?.position === 'absolute');
    expect(cover.props).toMatchObject({accessibilityElementsHidden: true, pointerEvents: 'box-none'});
    expect(StyleSheet.flatten(cover.props.style)).toMatchObject({position: 'absolute', top: 0, left: 0, right: 0, bottom: 0});
    await render(<TabView tabs={TABS} selected="a" onSelect={() => {}} layout="switcher" testID="t"/>);
    await fireEvent.press(screen.getByTestId('t-switcher'));
    expect(isHiddenFromAccessibility(anchor())).toBe(true);
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
    expect(screen.getByText('typing', {includeHiddenElements: true})).toBeOnTheScreen();
    const card = screen.getByTestId('t-card-a').parent!;
    await act(async () => card.props.onLayout({nativeEvent: {layout: {x: 16, y: 16, width: 160, height: 60}}}));
    // The grid has scrolled a little: the menu opens under the card as drawn.
    await act(async () => screen.getByTestId('t-cards').props.onScroll({nativeEvent: {contentOffset: {x: 0, y: 10}}}));
    await fireEvent(screen.getByTestId('t-card-a'), 'longPress');
    expect(menuOpen()).toBe(true);
    const anchor = host(p => p.matchContentsVertical !== undefined && StyleSheet.flatten(p.style)?.position === 'absolute');
    expect(StyleSheet.flatten(anchor.props.style)).toMatchObject({left: 16, top: 66});
  });
});

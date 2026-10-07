import {fireEvent, render, screen} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {colors} from '../theme';
import {ColorPicker} from '.';

const PICKER = 'ExpoInterfaceColorPicker';
const FLYOUT = 'ExpoInterfaceMenuFlyout';

describe('ColorPicker presentations (windows)', () => {
  it('puts the WinUI picker itself in the island for inline, under the label, and keeps the flyout for popover', async () => {
    await render(<ColorPicker label="Ink" value="#FF0000" presentation="inline" onValueChange={vi.fn()} testID="cp"/>);
    expect(island(PICKER).props.inPlace).toBe(true);
    expect(StyleSheet.flatten(screen.getByTestId('cp').props.style)).toMatchObject({flexDirection: 'column'});
    await render(<ColorPicker label="Ink" value="#FF0000" presentation="popover" onValueChange={vi.fn()} testID="cp"/>);
    expect(island(PICKER).props.inPlace).toBe(false);
  });

  it('opens a MenuFlyout of the swatches beside a drawn well, No color first', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPicker label="Ink" value="#E81123" presentation="menu" swatches="system" allowsNone onValueChange={onValueChange} testID="cp"/>);
    expect(() => island(PICKER)).toThrow();
    const well = screen.getByTestId('cp-well');
    // Nothing opens before the well is laid out.
    await fireEvent.press(well);
    expect(island(FLYOUT).props.open).toBe(false);
    await fireEvent(well.parent!, 'layout', {nativeEvent: {layout: {x: 200, y: 4, width: 28, height: 28}}});
    await fireEvent.press(well);
    const flyout = island(FLYOUT);
    expect(flyout.props.open).toBe(true);
    const items = JSON.parse(flyout.props.items) as {label: string}[];
    expect(items.map(item => item.label).slice(0, 3)).toEqual(['No color', 'Red', 'Orange']);
    await fireIsland(flyout, 'select', {index: 2});
    expect(onValueChange).toHaveBeenLastCalledWith('#F7630CFF');
    await fireIsland(island(FLYOUT), 'openChange', {open: false});
    expect(island(FLYOUT).props.open).toBe(false);
  });

  it('names a menu well without a label Color, and carries no test identifiers without a testID', async () => {
    await render(<ColorPicker value="#E81123" presentation="menu" onValueChange={vi.fn()}/>);
    expect(screen.getByRole('button', {name: 'Color'})).toBeOnTheScreen();
    expect(island(FLYOUT).props.testID).toBeUndefined();
  });

  it('offers No color beside the palette, and crosses out the well and its preset for it', async () => {
    const onValueChange = vi.fn();
    await render(<ColorPicker value="#E81123" swatches="system" allowsNone onValueChange={onValueChange} testID="cp"/>);
    expect(screen.getByRole('button', {name: 'Color Red'})).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', {name: 'No color'}));
    expect(onValueChange).toHaveBeenLastCalledWith('');
    await render(<ColorPicker value="" allowsNone presentation="menu" onValueChange={onValueChange} testID="cp"/>);
    // The well's crossed circle: the screen's background, a turned stroke in the destructive color.
    type Node = {props: {style?: unknown}; children: (Node | string)[]};
    const circle = (screen.getByTestId('cp-well') as unknown as Node).children[0] as Node;
    expect(StyleSheet.flatten(circle.props.style as never)).toMatchObject({backgroundColor: colors.light.background});
    expect(StyleSheet.flatten((circle.children[0] as Node).props.style as never)).toMatchObject({backgroundColor: colors.light.destructive, transform: [{rotate: '45deg'}]});
    await render(<ColorPicker value="" allowsNone onValueChange={onValueChange} testID="cp"/>);
    const none = screen.getByRole('button', {name: 'No color'});
    expect(StyleSheet.flatten(none.props.style)).toMatchObject({borderColor: colors.light.label});
  });
});

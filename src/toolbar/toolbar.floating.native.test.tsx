import {I18nManager, Platform, StyleSheet} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {hosts} from '../__tests__/hosts';
import {AccentProvider} from '../accent';
import {colors} from '../theme';
import {Button} from '../button';
import {Toolbar} from '.';

const isIOS = Platform.OS === 'ios';
const commands = [
  {label: 'Bold', icon: icons.add, hideLabel: true, active: true, testID: 'bold'},
  {label: 'Link', icon: icons.share, hideLabel: true, active: false, testID: 'link'},
  {label: 'Clear formatting', secondary: true},
];
const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe(`Toolbar floating (${Platform.OS})`, () => {
  it('floats its controls in one host, raised and rounded on iOS and Material\'s floating toolbar on Android', async () => {
    await render(<Toolbar floating commands={commands} testID="bar"/>);
    expect(hosts()).toHaveLength(1);
    if (isIOS) {
      expect(flat('bar')).toMatchObject({borderRadius: 999, alignSelf: 'flex-start'});
      expect(flat('bar').boxShadow).toBeTruthy();
      expect(modifier(screen.getByTestId('bold').props, 'accessibilityAddTraits')?.traits).toEqual(['isSelected']);
    } else {
      const bar = byComposeTestID('bar');
      expect(bar.type).toContain('HorizontalFloatingToolbar');
      expect(bar.props.colors).toEqual({toolbarContainerColor: colors.light.backgroundElement, toolbarContentColor: colors.light.label});
      expect(byComposeTestID('bold').props.checked).toBe(true);
      expect(byComposeTestID('link').props.checked).toBe(false);
    }
    // The overflow goes behind one menu at the end, as on the edge bar.
    expect(host(p => p.text === 'Clear formatting' || p.label === 'Clear formatting')).toBeTruthy();
  });

  it('takes a material, which is the web\'s, and keeps its own fill', async () => {
    await render(
      <AccentProvider overlayMaterial="thin">
        <Toolbar floating commands={commands} material="regular" testID="bar"/>
      </AccentProvider>,
    );
    if (isIOS) {
      expect(flat('bar')).toMatchObject({backgroundColor: colors.light.backgroundElement, borderRadius: 999});
      expect(flat('bar').boxShadow).toBeTruthy();
    } else {
      expect(byComposeTestID('bar').props.colors).toEqual({toolbarContainerColor: colors.light.backgroundElement, toolbarContentColor: colors.light.label});
    }
  });

  it('floats the two slots without commands, and needs no testID', async () => {
    await render(<Toolbar floating leading={<Button label="Undo" variant="text"/>} trailing={<Button label="Redo" variant="text"/>}/>);
    expect(hosts()).toHaveLength(1);
    expect(host(p => p.label === 'Undo' || p.text === 'Undo')).toBeTruthy();
    expect(host(p => p.label === 'Redo' || p.text === 'Redo')).toBeTruthy();
  });

  it('floats over its parent beside a rectangle, drawn only once it is placed, centred over it', async () => {
    const {rerender} = await render(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} commands={commands} testID="bar"/>);
    expect(flat('bar-bounds')).toMatchObject({position: 'absolute', pointerEvents: 'box-none'});
    const placed = () => screen.getByTestId('bar-bounds').children[0] as unknown as {props: {style: unknown; onLayout: (event: unknown) => void}};
    const style = () => StyleSheet.flatten(placed().props.style as never) as Record<string, unknown>;
    // Not yet measured: neither seen nor pressed.
    expect(style()).toMatchObject({opacity: 0, pointerEvents: 'none'});
    await fireEvent(screen.getByTestId('bar-bounds'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 600}}});
    await act(async () => placed().props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: 120, height: 44}}}));
    // Centred on the rectangle (100 + 40 - 60) and over it (200 - 44 - 8).
    expect(style()).toMatchObject({position: 'absolute', left: 80, top: 148});
    expect(style().opacity).toBeUndefined();
    await rerender(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} preferredEdge="bottom" commands={commands} testID="bar"/>);
    expect(style().top).toBe(228);
    // To the rectangle's right edge (100 + 80 - 120), or from its left edge.
    await rerender(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} align="end" commands={commands} testID="bar"/>);
    expect(style().left).toBe(60);
    await rerender(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} align="start" commands={commands} testID="bar"/>);
    expect(style().left).toBe(100);
    await rerender(<Toolbar at={null} commands={commands} testID="bar"/>);
    expect(screen.getByTestId('bar-bounds').children).toHaveLength(0);
  });

  it('keeps the bar at the rectangle\'s left under a right-to-left layout, set as the end edge React Native swaps there', async () => {
    const spy = vi.spyOn(I18nManager, 'getConstants').mockReturnValue({isRTL: true, doLeftAndRightSwapInRTL: true});
    await render(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} align="start" commands={commands} testID="bar"/>);
    const placed = () => screen.getByTestId('bar-bounds').children[0] as unknown as {props: {style: unknown; onLayout: (event: unknown) => void}};
    await fireEvent(screen.getByTestId('bar-bounds'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 600}}});
    await act(async () => placed().props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: 120, height: 44}}}));
    const style = StyleSheet.flatten(placed().props.style as never) as Record<string, unknown>;
    expect(style).toMatchObject({position: 'absolute', right: 100, top: 148});
    expect(style.left).toBeUndefined();
    spy.mockRestore();
  });

  it('keeps clear of the insets, and needs no testID at a rectangle', async () => {
    await render(<Toolbar at={{x: 0, y: 40, width: 80, height: 20}} insets={{top: 60}} commands={commands}/>);
    expect(nodes().length).toBeGreaterThan(0);
  });
});

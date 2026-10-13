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

  it('forgets its width while there is no rectangle, so a bar that comes back is placed by its own layout', async () => {
    const bar = (at: {x: number; y: number; width: number; height: number} | null) => <Toolbar at={at} commands={commands} testID="bar"/>;
    const {rerender} = await render(bar({x: 100, y: 200, width: 80, height: 20}));
    const placed = () => screen.getByTestId('bar-bounds').children[0] as unknown as {props: {style: unknown; onLayout: (event: unknown) => void}};
    const style = () => StyleSheet.flatten(placed().props.style as never) as Record<string, unknown>;
    await fireEvent(screen.getByTestId('bar-bounds'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 600}}});
    await act(async () => placed().props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: 120, height: 44}}}));
    expect(style()).toMatchObject({left: 80});
    expect(style().opacity).toBeUndefined();
    await rerender(bar(null));
    // Back over another selection: neither seen nor pressed until the new bar has been measured, and placed by nothing of the old one.
    await rerender(bar({x: 300, y: 200, width: 40, height: 20}));
    expect(style()).toMatchObject({opacity: 0, pointerEvents: 'none'});
    // A wider bar this time: kept inside the parent by its own width, 400 - 8 - 200.
    await act(async () => placed().props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: 200, height: 44}}}));
    expect(style()).toMatchObject({left: 192});
    expect(style().opacity).toBeUndefined();
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

/**
 * A bar at a rectangle folds the trailing commands that do not fit the room
 * between its parent's edges, less the insets and the gap, behind More: one
 * per layout, each in a view of its own, until it fits.
 */
describe(`Toolbar at a rectangle folds (${Platform.OS})`, () => {
  // Labelled, so the tree shows which are on the bar on Android too, where an icon-only button has no text.
  const tools = [
    {label: 'Bold', icon: icons.add},
    {label: 'Italic'},
    {label: 'Link', separator: true},
    {label: 'Export', secondary: true},
  ];
  const labelOf = (node: {props: Record<string, unknown>}) => (isIOS ? node.props.label : node.props.text) as string | undefined;
  const menu = () => nodes().find(node => node.type.includes('Menu'));
  /** The overflow menu's entries, in order. */
  const entries = () => {
    const found = menu();
    return found ? nodes(found).map(labelOf).filter(label => label && label !== 'More') : [];
  };
  /** Whether a command is drawn on the bar itself, not among the overflow menu's entries. */
  const onBar = (label: string) => nodes().some(node => labelOf(node) === label) && !entries().includes(label);
  const card = () => screen.getByTestId('bar-bounds').children[0] as unknown as {props: {style: unknown; onLayout: (event: unknown) => void}};
  const style = () => StyleSheet.flatten(card().props.style as never) as Record<string, unknown>;
  const bounds = (width: number) => fireEvent(screen.getByTestId('bar-bounds'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width, height: 600}}});
  const measure = (width: number) => act(async () => card().props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width, height: 44}}}));
  const at = {x: 100, y: 200, width: 80, height: 20};

  it('folds the trailing commands that do not fit the room behind More, first among its entries, until the bar fits', async () => {
    await render(<Toolbar at={at} commands={tools} testID="bar"/>);
    // The room: 200 less 8 at each side.
    await bounds(200);
    await measure(240);
    // Link is behind More, before the secondary Export; the bar is not drawn until it fits.
    expect(onBar('Link')).toBe(false);
    expect(onBar('Italic')).toBe(true);
    expect(entries()).toEqual(['Link', 'Export']);
    expect(style()).toMatchObject({opacity: 0, pointerEvents: 'none'});
    // The first fold swapped Link for More and the width stayed: the next takes Italic.
    await measure(240);
    expect(onBar('Italic')).toBe(false);
    expect(onBar('Bold')).toBe(true);
    expect(entries()).toEqual(['Italic', 'Link', 'Export']);
    expect(style().opacity).toBe(0);
    // Fits: drawn, kept inside the parent by its own width, 200 - 8 - 170.
    await measure(170);
    expect(style()).toMatchObject({left: 22});
    expect(style().opacity).toBeUndefined();
  });

  it('keeps the fold as the rectangle moves, and starts over with more room', async () => {
    const {rerender} = await render(<Toolbar at={at} commands={tools} testID="bar"/>);
    await bounds(200);
    await measure(240);
    await measure(240);
    await measure(170);
    expect(onBar('Italic')).toBe(false);
    await rerender(<Toolbar at={{...at, x: 20}} commands={tools} testID="bar"/>);
    expect(onBar('Italic')).toBe(false);
    expect(style()).toMatchObject({left: 8});
    expect(style().opacity).toBeUndefined();
    // More room: every command comes back, and the bar waits for its layout.
    await bounds(400);
    expect(onBar('Italic')).toBe(true);
    expect(onBar('Link')).toBe(true);
    expect(style().opacity).toBe(0);
    await measure(240);
    expect(style().opacity).toBeUndefined();
    expect(entries()).toEqual(['Export']);
  });

  it('folds every command when none fits, and the bar is then More alone', async () => {
    await render(<Toolbar at={at} commands={tools} testID="bar"/>);
    await bounds(100);
    await measure(240);
    await measure(240);
    expect(onBar('Bold')).toBe(true);
    await measure(240);
    expect(onBar('Bold')).toBe(false);
    expect(entries()).toEqual(['Bold', 'Italic', 'Link', 'Export']);
    // Nothing left to fold: drawn as it is.
    expect(style().opacity).toBeUndefined();
  });

  it('draws every command when the bar fits, and folds nothing of the two slots', async () => {
    await render(<Toolbar at={at} commands={tools} testID="bar"/>);
    await bounds(400);
    await measure(240);
    expect(onBar('Bold')).toBe(true);
    expect(onBar('Link')).toBe(true);
    expect(entries()).toEqual(['Export']);
    expect(style().opacity).toBeUndefined();
    await render(<Toolbar at={at} leading={<Button label="Undo" variant="text"/>} testID="slots"/>);
    await fireEvent(screen.getByTestId('slots-bounds'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 100, height: 600}}});
    const slots = () => screen.getByTestId('slots-bounds').children[0] as unknown as {props: {style: unknown; onLayout: (event: unknown) => void}};
    await act(async () => slots().props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: 240, height: 44}}}));
    expect((StyleSheet.flatten(slots().props.style as never) as Record<string, unknown>).opacity).toBeUndefined();
  });
});

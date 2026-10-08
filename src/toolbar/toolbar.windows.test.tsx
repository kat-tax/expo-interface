import {fireIsland, island, islands} from 'expo-vitest/windows';
import {windowsGlyph} from '../symbol/segoe';
import * as icons from '../__stories__/icons';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {StyleSheet, Text} from 'react-native';
import {Toolbar} from '.';

describe('Toolbar (windows)', () => {
  it('draws the controls in React Native rows with a rule on the content edge', async () => {
    await render(
      <Toolbar leading={<Text>Bold</Text>} trailing={<Text>Share</Text>} testID="bar">
        <Text>Second row</Text>
      </Toolbar>,
    );
    const bar = screen.getByTestId('bar');
    expect(bar).toHaveStyle({borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16});
    for (const text of ['Bold', 'Share', 'Second row']) expect(screen.getByText(text)).toBeOnTheScreen();
  });

  it('puts the rule on the bottom of a top bar and packs a compact bar tighter', async () => {
    await render(<Toolbar placement="top" density="compact" leading={<Text>Bold</Text>} testID="bar"/>);
    expect(screen.getByTestId('bar')).toHaveStyle({borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8});
    expect(screen.getByText('Bold').parent).toHaveStyle({gap: 2});
  });

  it('grows a field into the space between the groups', async () => {
    await render(<Toolbar field={<Text testID="field">Search</Text>} testID="bar"/>);
    expect(screen.getByTestId('field').parent).toHaveStyle({flex: 1});
  });
});

describe('commands (windows)', () => {
  const BAR = 'ExpoInterfaceCommandBar';
  const commands = [
    {label: 'Undo', icon: icons.share, onPress: vi.fn()},
    {label: 'Delete', secondary: true, role: 'destructive' as const, separator: true, disabled: true},
  ];

  it('becomes a real CommandBar, which lays the commands out itself', async () => {
    await render(<Toolbar commands={commands} testID="bar"/>);
    const props = island(BAR).props;
    // The commands cross as data because that is what the control wants: it
    // builds its own buttons and decides which of them fit.
    expect(JSON.parse(props.commands)).toEqual([
      {label: 'Undo', glyph: windowsGlyph(icons.share), secondary: false, disabled: false, role: 'default', separator: false, toggle: false, checked: false},
      {label: 'Delete', glyph: undefined, secondary: true, disabled: true, role: 'destructive', separator: true, toggle: false, checked: false},
    ]);
    expect(props.labels).toBe('right');
  });

  it('puts the rule on the side facing the content, whichever edge it sits on', async () => {
    await render(<Toolbar commands={commands} placement="top" testID="top"/>);
    expect(StyleSheet.flatten(screen.getByTestId('top').props.style).borderBottomWidth).toBeGreaterThan(0);
    await render(<Toolbar commands={commands} testID="bottom"/>);
    expect(StyleSheet.flatten(screen.getByTestId('bottom').props.style).borderTopWidth).toBeGreaterThan(0);
  });

  it('hands a command with an on state to the bar as its own toggle button', async () => {
    await render(<Toolbar commands={[{label: 'Bold', active: true}, {label: 'Italic', active: false}, {label: 'Clear'}]}/>);
    expect(JSON.parse(island(BAR).props.commands).map(({toggle, checked}: {toggle: boolean; checked: boolean}) => ({toggle, checked}))).toEqual([
      {toggle: true, checked: true},
      {toggle: true, checked: false},
      {toggle: false, checked: false},
    ]);
  });

  it('floats the bar raised and rounded, its labels left to the overflow', async () => {
    await render(<Toolbar floating commands={commands} testID="bar"/>);
    expect(island(BAR).props.labels).toBe('collapsed');
    expect(island(BAR).props.style).toMatchObject({height: 48});
    const bar = StyleSheet.flatten(screen.getByTestId('bar').props.style);
    expect(bar).toMatchObject({borderRadius: 12, alignSelf: 'flex-start'});
    expect(bar.borderTopWidth).toBeGreaterThan(0);
  });

  it('floats beside a rectangle once placed, drawn by the kit around a field', async () => {
    const {rerender} = await render(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} commands={commands} testID="bar"/>);
    const placed = () => screen.getByTestId('bar-bounds').children[0] as unknown as {props: {style: unknown; onLayout: (event: unknown) => void}};
    const style = () => StyleSheet.flatten(placed().props.style as never) as Record<string, unknown>;
    expect(style()).toMatchObject({opacity: 0});
    await fireEvent(screen.getByTestId('bar-bounds'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 600}}});
    await act(async () => placed().props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: 120, height: 48}}}));
    expect(style()).toMatchObject({left: 80, top: 144});
    await rerender(<Toolbar at={{x: 0, y: 0}} field={<Text>Link</Text>} leading={<Text>Edit</Text>} testID="drawn"/>);
    expect(screen.getByText('Link')).toBeOnTheScreen();
    expect(StyleSheet.flatten(screen.getByTestId('drawn').props.style)).toMatchObject({borderRadius: 12, alignSelf: 'flex-start'});
    await rerender(<Toolbar at={null} commands={commands}/>);
    expect(islands(BAR)).toHaveLength(0);
  });

  it('draws its commands as the kit\'s buttons beside a field, with the field\'s commands and the overflow trailing', async () => {
    const onBold = vi.fn();
    await render(
      <Toolbar
        commands={[{label: 'Bold', active: true, onPress: onBold, testID: 'bold'}, {label: 'Export', secondary: true}]}
        field={<Text>Find</Text>}
        fieldCommands={[{label: 'Next match', testID: 'next'}]}
        testID="bar"
      />,
    );
    expect(islands(BAR)).toHaveLength(0);
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Bold', 'Next match', 'More']);
    // A toggle that is on is drawn filled.
    expect(island('ExpoInterfaceButton', 0).props.variant).toBe('filled');
    await fireEvent(screen.getByTestId('bold'), 'press');
    expect(onBold).toHaveBeenCalledTimes(1);
    expect(JSON.parse(island('ExpoInterfaceMenuFlyout').props.items).map((item: {label: string}) => item.label)).toEqual(['Export']);
  });

  it('folds its commands behind the overflow in the compact size class, keeping the field\'s', async () => {
    await render(
      <Toolbar commands={[{label: 'Bold'}, {label: 'Italic'}]} field={<Text>Find</Text>} fieldCommands={[{label: 'Close'}]} foldCommands testID="bar"/>,
    );
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Bold', 'Italic', 'Close']);
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 48}}});
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Close', 'More']);
    expect(JSON.parse(island('ExpoInterfaceMenuFlyout').props.items).map((item: {label: string}) => item.label)).toEqual(['Bold', 'Italic']);
  });

  it('measures the drawn bar whether or not it folds, so a fold turned on once it is narrow takes no new layout', async () => {
    const bar = (fold: boolean) => (
      <Toolbar commands={[{label: 'Bold'}, {label: 'Italic'}]} field={<Text>Find</Text>} fieldCommands={[{label: 'Close'}]} foldCommands={fold} testID="bar"/>
    );
    const {rerender} = await render(bar(false));
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 48}}});
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Bold', 'Italic', 'Close']);
    await rerender(bar(true));
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Close', 'More']);
  });

  it('floats a drawn bar with no spacer between its slots', async () => {
    await render(<Toolbar floating leading={<Text>Undo</Text>} trailing={<Text>Redo</Text>} testID="bar"/>);
    expect(screen.getByText('Undo')).toBeOnTheScreen();
    expect(StyleSheet.flatten(screen.getByTestId('bar').props.style)).toMatchObject({borderRadius: 12});
  });

  it('leaves the labels to the overflow when the bar is dense', async () => {
    await render(<Toolbar commands={commands} density="compact"/>);
    expect(island(BAR).props.labels).toBe('collapsed');
  });

  it('reports a press by index, which is how the command is found again', async () => {
    await render(<Toolbar commands={commands}/>);
    await fireIsland(island(BAR), 'press', {index: 0});
    expect(commands[0]!.onPress).toHaveBeenCalledTimes(1);
  });

  it('draws the bar itself when there is a field, which cannot go in the island', async () => {
    await render(<Toolbar commands={commands} field={<Text>Search</Text>} testID="bar"/>);
    expect(islands(BAR)).toHaveLength(0);
    expect(screen.getByText('Search')).toBeOnTheScreen();
  });
});

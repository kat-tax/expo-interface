import {fireIsland, island, islands} from 'expo-vitest/windows';
import {windowsGlyph} from '../symbol/segoe';
import * as icons from '../__stories__/icons';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {I18nManager, StyleSheet, Text} from 'react-native';
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
    // To the rectangle's right edge: 100 + 80 - 120.
    await rerender(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} align="end" commands={commands} testID="bar"/>);
    expect(style()).toMatchObject({left: 60});
    await rerender(<Toolbar at={{x: 0, y: 0}} field={<Text>Link</Text>} leading={<Text>Edit</Text>} testID="drawn"/>);
    expect(screen.getByText('Link')).toBeOnTheScreen();
    expect(StyleSheet.flatten(screen.getByTestId('drawn').props.style)).toMatchObject({borderRadius: 12, alignSelf: 'flex-start'});
    await rerender(<Toolbar at={null} commands={commands}/>);
    expect(islands(BAR)).toHaveLength(0);
  });

  it('keeps left under a right-to-left layout, since react-native-windows swaps no left and right', async () => {
    // What react-native-windows reports for a right-to-left app.
    const spy = vi.spyOn(I18nManager, 'getConstants').mockReturnValue({isRTL: true, doLeftAndRightSwapInRTL: false});
    await render(<Toolbar at={{x: 100, y: 200, width: 80, height: 20}} commands={commands} testID="bar"/>);
    const placed = screen.getByTestId('bar-bounds').children[0] as unknown as {props: {style: unknown}};
    const style = StyleSheet.flatten(placed.props.style as never) as Record<string, unknown>;
    expect(style.left).toEqual(expect.any(Number));
    expect(style.right).toBeUndefined();
    spy.mockRestore();
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

  it('folds its commands behind the overflow in the compact size class, keeping the field\'s and the toggles\' state', async () => {
    await render(
      <Toolbar commands={[{label: 'Bold', active: true}, {label: 'Italic'}]} field={<Text>Find</Text>} fieldCommands={[{label: 'Close'}]} foldCommands testID="bar"/>,
    );
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Bold', 'Italic', 'Close']);
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 48}}});
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Close', 'More']);
    const items = JSON.parse(island('ExpoInterfaceMenuFlyout').props.items) as {label: string; active: boolean}[];
    expect(items.map(item => item.label)).toEqual(['Bold', 'Italic']);
    // A toggle that is on keeps its check in the flyout.
    expect(items.map(item => item.active)).toEqual([true, false]);
  });

  it('draws a rule before a command that asks for one on the drawn bar, and none before the first', async () => {
    await render(<Toolbar commands={[{label: 'Bold', separator: true}, {label: 'Italic', separator: true}]} field={<Text>Find</Text>}/>);
    // The Windows Divider: a hairline view with the separator role, which is not an accessibility element of its own.
    const rules = screen.container.queryAll(node => node.props.role === 'separator');
    expect(rules).toHaveLength(1);
    expect(rules[0]!.props['aria-orientation']).toBe('vertical');
    // Between the two commands.
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Bold', 'Italic']);
    const row = rules[0]!.parent!;
    expect(row.children.indexOf(rules[0]!)).toBe(1);
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

  it('folds at once when a field opens on a CommandBar that was measured narrow, with no layout of the drawn bar', async () => {
    const {rerender} = await render(<Toolbar commands={[{label: 'Bold'}, {label: 'Italic'}]} testID="bar"/>);
    expect(islands(BAR)).toHaveLength(1);
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 68}}});
    // The documented fold: a field and foldCommands arrive together, which
    // swaps the CommandBar for the drawn bar.
    await rerender(
      <Toolbar commands={[{label: 'Bold'}, {label: 'Italic'}]} field={<Text>Find</Text>} fieldCommands={[{label: 'Close'}]} foldCommands testID="bar"/>,
    );
    expect(islands(BAR)).toHaveLength(0);
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Close', 'More']);
  });

  it('never folds a floating bar, which is the width of its controls', async () => {
    await render(<Toolbar floating commands={[{label: 'Bold'}, {label: 'Italic'}]} field={<Text>Find</Text>} foldCommands testID="bar"/>);
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 300, height: 48}}});
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Bold', 'Italic']);
  });

  it('greys out a menu command with no entries, on the CommandBar and on the drawn bar', async () => {
    const menus = [{label: 'Recent', items: []}, {label: 'Sort', items: [{label: 'Name'}]}];
    const {rerender} = await render(<Toolbar commands={menus}/>);
    expect(JSON.parse(island(BAR).props.commands).map((command: {disabled: boolean}) => command.disabled)).toEqual([true, false]);
    await rerender(<Toolbar commands={menus} field={<Text>Find</Text>}/>);
    expect(islands('ExpoInterfaceButton').map(button => [button.props.label, button.props.disabled])).toEqual([['Recent', true], ['Sort', false]]);
  });

  it('keeps a secondary menu command with no entries in the CommandBar, greyed out', async () => {
    await render(<Toolbar commands={[{label: 'Undo'}, {label: 'Recent', secondary: true, items: []}]}/>);
    const sent = JSON.parse(island(BAR).props.commands) as {label: string; secondary: boolean; disabled: boolean; menu?: unknown[]}[];
    expect(sent.map(({label, secondary, disabled}) => ({label, secondary, disabled}))).toEqual([
      {label: 'Undo', secondary: false, disabled: false},
      {label: 'Recent', secondary: true, disabled: true},
    ]);
    expect(sent[1]!.menu).toEqual([]);
  });

  it('draws no overflow on the drawn bar when the commands behind it are only menus with no entries', async () => {
    await render(<Toolbar commands={[{label: 'Undo'}, {label: 'Recent', secondary: true, items: []}]} field={<Text>Find</Text>}/>);
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Undo']);
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

  it('hands a menu command to the bar with its entries, as a button with a flyout', async () => {
    await render(
      <Toolbar
        commands={[
          {label: 'Bold'},
          // A menu takes no press of its own: no role, no on state.
          {label: 'Turn into', role: 'destructive', active: true, items: [{label: 'Heading'}, {label: 'Quote', active: true, separator: true}]},
        ]}
      />,
    );
    const [, menu] = JSON.parse(island(BAR).props.commands);
    expect(menu).toMatchObject({label: 'Turn into', role: 'default', toggle: false, checked: false});
    expect(menu.menu).toEqual([
      {label: 'Heading', glyph: null, swatch: null, shortcut: null, active: false, destructive: false, disabled: false, separator: false},
      {label: 'Quote', glyph: null, swatch: null, shortcut: null, active: true, destructive: false, disabled: false, separator: true},
    ]);
  });

  it('reports a pick from a menu command\'s flyout by the command and the entry, and its own press as -1', async () => {
    const onBold = vi.fn();
    const onTurn = vi.fn();
    const onHeading = vi.fn();
    await render(<Toolbar commands={[{label: 'Bold', onPress: onBold}, {label: 'Turn into', onPress: onTurn, items: [{label: 'Heading', onPress: onHeading}, {label: 'Quote'}]}]}/>);
    await fireIsland(island(BAR), 'press', {index: 1, item: 0});
    expect(onHeading).toHaveBeenCalledTimes(1);
    // The press that opens the flyout runs nothing.
    await fireIsland(island(BAR), 'press', {index: 1, item: -1});
    expect(onHeading).toHaveBeenCalledTimes(1);
    expect(onTurn).not.toHaveBeenCalled();
    // An entry with no handler, and a plain command's press.
    await fireIsland(island(BAR), 'press', {index: 1, item: 1});
    await fireIsland(island(BAR), 'press', {index: 0, item: -1});
    expect(onBold).toHaveBeenCalledTimes(1);
    // An index the bar no longer has.
    await fireIsland(island(BAR), 'press', {index: 5, item: -1});
  });

  it('binds a menu command\'s shortcuts while the bar is mounted, except a disabled command\'s', async () => {
    const {LayerHost} = await import('../windows/layer');
    const onHeading = vi.fn();
    const onArchive = vi.fn();
    await render(
      <LayerHost testID="host">
        <Toolbar
          commands={[
            {label: 'Turn into', items: [{label: 'Heading', shortcut: 'Ctrl+H', onPress: onHeading}]},
            {label: 'More', disabled: true, items: [{label: 'Archive', shortcut: 'Ctrl+E', onPress: onArchive}]},
          ]}
        />
      </LayerHost>,
    );
    const press = (key: string) => fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key, ctrlKey: true, shiftKey: false, altKey: false, metaKey: false}});
    await press('h');
    expect(onHeading).toHaveBeenCalledTimes(1);
    await press('e');
    expect(onArchive).not.toHaveBeenCalled();
  });

  it('greys out a disabled menu command\'s entries on the drawn bar, and binds none of their shortcuts', async () => {
    const {LayerHost} = await import('../windows/layer');
    const onHeading = vi.fn();
    const onArchive = vi.fn();
    await render(
      <LayerHost testID="host">
        <Toolbar
          commands={[
            {label: 'Turn into', items: [{label: 'Heading', shortcut: 'Ctrl+H', onPress: onHeading}]},
            {label: 'More', disabled: true, items: [{label: 'Archive', shortcut: 'Ctrl+E', onPress: onArchive}]},
          ]}
          field={<Text>Find</Text>}
        />
      </LayerHost>,
    );
    expect(islands('ExpoInterfaceMenuFlyout').map(flyout => JSON.parse(flyout.props.items).map((item: {disabled: boolean}) => item.disabled))).toEqual([
      [false],
      [true],
    ]);
    const press = (key: string) => fireEvent(screen.getByTestId('host'), 'keyDown', {nativeEvent: {key, ctrlKey: true, shiftKey: false, altKey: false, metaKey: false}});
    await press('h');
    expect(onHeading).toHaveBeenCalledTimes(1);
    await press('e');
    expect(onArchive).not.toHaveBeenCalled();
  });

  it('draws a menu command as the kit\'s menu beside a field, and its entries in the overflow when it folds', async () => {
    const commands = [{label: 'Turn into', items: [{label: 'Heading'}, {label: 'Quote'}]}, {label: 'Export', secondary: true}];
    await render(<Toolbar commands={commands} field={<Text>Find</Text>} testID="bar"/>);
    expect(islands('ExpoInterfaceButton').map(button => button.props.label)).toEqual(['Turn into', 'More']);
    expect(islands('ExpoInterfaceMenuFlyout').map(flyout => JSON.parse(flyout.props.items).map((item: {label: string}) => item.label))).toEqual([
      ['Heading', 'Quote'],
      ['Export'],
    ]);
    await render(<Toolbar commands={commands} field={<Text>Find</Text>} foldCommands testID="folded"/>);
    await fireEvent(screen.getByTestId('folded'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 48}}});
    const items = JSON.parse(island('ExpoInterfaceMenuFlyout').props.items) as {label: string; separator: boolean}[];
    expect(items.map(item => [item.label, item.separator])).toEqual([['Heading', true], ['Quote', false], ['Export', true]]);
  });

  it('draws the bar itself when there is a field, which cannot go in the island', async () => {
    await render(<Toolbar commands={commands} field={<Text>Search</Text>} testID="bar"/>);
    expect(islands(BAR)).toHaveLength(0);
    expect(screen.getByText('Search')).toBeOnTheScreen();
  });
});

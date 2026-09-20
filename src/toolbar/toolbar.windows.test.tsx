import {fireIsland, island, islands} from 'expo-vitest/windows';
import {windowsGlyph} from '../symbol/segoe';
import * as icons from '../__stories__/icons';
import {render, screen} from '@testing-library/react-native';
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
      {label: 'Undo', glyph: windowsGlyph(icons.share), secondary: false, disabled: false, role: 'default', separator: false},
      {label: 'Delete', glyph: undefined, secondary: true, disabled: true, role: 'destructive', separator: true},
    ]);
    expect(props.labels).toBe('right');
  });

  it('puts the rule on the side facing the content, whichever edge it sits on', async () => {
    await render(<Toolbar commands={commands} placement="top" testID="top"/>);
    expect(StyleSheet.flatten(screen.getByTestId('top').props.style).borderBottomWidth).toBeGreaterThan(0);
    await render(<Toolbar commands={commands} testID="bottom"/>);
    expect(StyleSheet.flatten(screen.getByTestId('bottom').props.style).borderTopWidth).toBeGreaterThan(0);
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

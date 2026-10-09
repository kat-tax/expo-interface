import {Platform, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {nodes} from 'expo-vitest/native';
import {hosts} from '../__tests__/hosts';
import {Toolbar} from '.';

const isIOS = Platform.OS === 'ios';
const labelOf = (node: {props: Record<string, unknown>}) => (isIOS ? node.props.label : node.props.text) as string | undefined;
/** Whether a command is drawn on the bar itself, not among the overflow menu's items. */
const onBar = (label: string) => {
  const menu = nodes().find(node => node.type.includes('Menu'));
  const overflow = new Set(menu ? nodes(menu).map(labelOf).filter(Boolean) : []);
  return nodes().some(node => labelOf(node) === label) && !overflow.has(label);
};
const commands = [{label: 'Bold'}, {label: 'Italic'}, {label: 'Export', secondary: true}];
const fieldCommands = [{label: 'Next match'}, {label: 'Close'}];

describe(`Toolbar field commands and folding (${Platform.OS})`, () => {
  it('draws the field\'s commands in the trailing host, still two hosts around a field', async () => {
    await render(<Toolbar commands={commands} field={<Text>Find</Text>} fieldCommands={fieldCommands} testID="bar"/>);
    expect(hosts()).toHaveLength(2);
    expect(onBar('Next match')).toBe(true);
    expect(onBar('Close')).toBe(true);
    expect(onBar('Bold')).toBe(true);
  });

  it('draws the field\'s commands before the trailing slot of a bar without commands', async () => {
    await render(<Toolbar field={<Text>Find</Text>} fieldCommands={fieldCommands} trailing={<Text>after</Text>}/>);
    expect(onBar('Next match')).toBe(true);
    expect(screen.getByText('after')).toBeOnTheScreen();
    await render(<Toolbar field={<Text>Find</Text>} fieldCommands={[]} trailing={<Text>alone</Text>}/>);
    expect(screen.getByText('alone')).toBeOnTheScreen();
  });

  it('folds its commands behind the overflow in the compact size class, and keeps the field\'s', async () => {
    await render(<Toolbar commands={commands} field={<Text>Find</Text>} fieldCommands={fieldCommands} foldCommands testID="bar"/>);
    // Not measured yet: nothing folds.
    expect(onBar('Bold')).toBe(true);
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 48}}});
    expect(onBar('Bold')).toBe(false);
    expect(onBar('Italic')).toBe(false);
    expect(onBar('Next match')).toBe(true);
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(true);
    // Wide enough again: back on the bar.
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 800, height: 48}}});
    expect(onBar('Bold')).toBe(true);
  });

  it('never folds a floating bar, which is the width of its controls', async () => {
    await render(<Toolbar floating commands={commands} foldCommands/>);
    expect(onBar('Bold')).toBe(true);
    expect(onBar('Italic')).toBe(true);
  });

  it('keeps a folded toggle\'s state as the overflow menu\'s check', async () => {
    await render(<Toolbar commands={[{label: 'Bold', active: true}, {label: 'Italic', active: false}]} field={<Text>Find</Text>} foldCommands testID="bar"/>);
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 48}}});
    const menu = nodes().find(node => node.type.includes('Menu'))!;
    if (isIOS) {
      expect(nodes(menu).find(node => node.props.label === 'Bold')).toMatchObject({type: expect.stringContaining('Toggle'), props: {isOn: true}});
      expect(nodes(menu).find(node => node.props.label === 'Italic')?.type).toContain('Button');
    } else {
      const entry = (label: string) => nodes(menu).find(node => node.type.endsWith('DropdownMenuItemView') && nodes(node).some(child => child.props.text === label))!;
      expect(nodes(entry('Bold')).some(node => node.props.text === '✓')).toBe(true);
      expect(nodes(entry('Italic')).some(node => node.props.text === '✓')).toBe(false);
    }
  });

  it('measures the bar whether or not it folds, so a fold turned on once it is narrow takes no new layout', async () => {
    const bar = (fold: boolean) => <Toolbar commands={commands} field={<Text>Find</Text>} fieldCommands={fieldCommands} foldCommands={fold} testID="bar"/>;
    const {rerender} = await render(bar(false));
    await fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 48}}});
    // Narrow, but not folding: the commands stay on the bar.
    expect(onBar('Bold')).toBe(true);
    // The fold arrives with no further layout event, as when a field opens in a bar that keeps its frame.
    await rerender(bar(true));
    expect(onBar('Bold')).toBe(false);
    expect(onBar('Next match')).toBe(true);
  });
});

/**
 * A host beside a field is sized to its content, and one that empties keeps
 * the size it last had on Android: a side with nothing to draw mounts none,
 * so the field takes its room.
 */
describe(`Toolbar hosts around a field (${Platform.OS})`, () => {
  const plain = [{label: 'Bold'}, {label: 'Italic'}];
  const narrow = () => fireEvent(screen.getByTestId('bar'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 48}}});

  it('mounts the leading host alone when no command trails the field', async () => {
    await render(<Toolbar commands={plain} field={<Text>Find</Text>} testID="bar"/>);
    expect(hosts()).toHaveLength(1);
    expect(onBar('Bold')).toBe(true);
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(false);
  });

  it('mounts the trailing host alone once folded, holding the overflow', async () => {
    await render(<Toolbar commands={plain} field={<Text>Find</Text>} foldCommands testID="bar"/>);
    await narrow();
    expect(hosts()).toHaveLength(1);
    expect(onBar('Bold')).toBe(false);
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(true);
  });

  it('mounts no host once folded with nothing to put behind the overflow', async () => {
    // A menu command with no entries is greyed out on the bar, and puts nothing behind the overflow.
    await render(<Toolbar commands={[{label: 'Recent', items: []}]} field={<Text>Find</Text>} foldCommands testID="bar"/>);
    expect(hosts()).toHaveLength(1);
    await narrow();
    expect(hosts()).toHaveLength(0);
    expect(screen.getByText('Find')).toBeOnTheScreen();
  });

  it('mounts both hosts with the field\'s commands, and folding leaves the trailing one', async () => {
    await render(<Toolbar commands={plain} field={<Text>Find</Text>} fieldCommands={fieldCommands} foldCommands testID="bar"/>);
    expect(hosts()).toHaveLength(2);
    // Nothing behind the overflow, so no ellipsis beside the field's commands.
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(false);
    await narrow();
    // Folded: the leading host goes, and the overflow joins the field's commands in the trailing one.
    expect(hosts()).toHaveLength(1);
    expect(onBar('Next match')).toBe(true);
    expect(onBar('Bold')).toBe(false);
    expect(nodes().some(node => node.type.includes('Menu'))).toBe(true);
  });
});

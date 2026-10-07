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

  it('measures nothing when it does not fold', async () => {
    await render(<Toolbar commands={commands} testID="bar"/>);
    expect(screen.getByTestId('bar').props.onLayout).toBeUndefined();
  });
});

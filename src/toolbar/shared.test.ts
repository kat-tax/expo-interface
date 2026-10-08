import {describe, expect, it, vi} from 'vitest';
import type {ToolbarCommand} from './types';
import * as icons from '../__stories__/icons';
import {hasCommands, overflowItems, splitCommands} from './shared';

const commands: ToolbarCommand[] = [
  {label: 'Undo'},
  {label: 'Redo'},
  {label: 'Export', secondary: true},
  {label: 'Delete', secondary: true, role: 'destructive'},
];

describe('splitCommands', () => {
  it('keeps what belongs on the bar apart from what belongs behind the overflow', () => {
    const {primary, secondary} = splitCommands(commands);
    expect(primary.map(command => command.label)).toEqual(['Undo', 'Redo']);
    expect(secondary.map(command => command.label)).toEqual(['Export', 'Delete']);
  });

  it('puts everything on the bar when nothing asked to be hidden', () => {
    expect(splitCommands([{label: 'Undo'}]).secondary).toEqual([]);
    expect(splitCommands([]).primary).toEqual([]);
  });
});

describe('overflowItems', () => {
  it('keeps what an entry can show of each command: its label, icon, state, role, rule and press', () => {
    const onPress = vi.fn();
    const items = overflowItems([
      {label: 'Spellcheck', icon: icons.star, active: true, onPress, hideLabel: true, tone: 'label', testID: 'spell'},
      {label: 'Wrap', active: false, separator: true},
      {label: 'Delete', role: 'destructive', disabled: true},
    ]);
    expect(items).toEqual([
      {label: 'Spellcheck', icon: icons.star, active: true, role: undefined, disabled: undefined, separator: undefined, onPress},
      {label: 'Wrap', icon: undefined, active: false, role: undefined, disabled: undefined, separator: true, onPress: undefined},
      {label: 'Delete', icon: undefined, active: undefined, role: 'destructive', disabled: true, separator: undefined, onPress: undefined},
    ]);
    expect(items[0]!.onPress).toBe(onPress);
  });
});

describe('hasCommands', () => {
  it('is false for a bar that was given none, or an empty list', () => {
    expect(hasCommands(undefined)).toBe(false);
    expect(hasCommands([])).toBe(false);
    expect(hasCommands(commands)).toBe(true);
  });
});

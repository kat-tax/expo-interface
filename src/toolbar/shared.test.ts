import {describe, expect, it} from 'vitest';
import type {ToolbarCommand} from './types';
import {hasCommands, splitCommands} from './shared';

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

describe('hasCommands', () => {
  it('is false for a bar that was given none, or an empty list', () => {
    expect(hasCommands(undefined)).toBe(false);
    expect(hasCommands([])).toBe(false);
    expect(hasCommands(commands)).toBe(true);
  });
});

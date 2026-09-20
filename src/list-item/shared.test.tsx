import {describe, expect, it} from 'vitest';
import type {ListItemSwipeAction} from './types';
import {asMenuItems} from './shared';

const actions: ListItemSwipeAction[] = [
  {label: 'Share', onPress: () => {}},
  {label: 'Delete', role: 'destructive', disabled: true, onPress: () => {}},
];

describe('asMenuItems', () => {
  it('carries each action across as a menu entry, roles and all', () => {
    expect(asMenuItems(actions)).toEqual([
      {label: 'Share', icon: undefined, role: undefined, disabled: undefined, onPress: expect.any(Function)},
      {label: 'Delete', icon: undefined, role: 'destructive', disabled: true, onPress: expect.any(Function)},
    ]);
  });

  it('has nothing to carry for a row with no actions', () => {
    expect(asMenuItems([])).toEqual([]);
  });
});

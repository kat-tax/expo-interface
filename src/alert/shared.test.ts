import type {AlertAction} from './types';
import {DEFAULT_ACTIONS, splitActions} from './shared';

describe('splitActions', () => {
  it('defaults to a single cancel-style OK action', () => {
    expect(DEFAULT_ACTIONS).toEqual([{label: 'OK', role: 'cancel'}]);
    expect(splitActions()).toEqual({cancel: DEFAULT_ACTIONS[0], others: []});
  });

  it('separates the cancel action from the rest, keeping their order', () => {
    const cancel: AlertAction = {label: 'Cancel', role: 'cancel'};
    const save: AlertAction = {label: 'Save'};
    const discard: AlertAction = {label: 'Discard', role: 'destructive'};
    expect(splitActions([discard, cancel, save])).toEqual({cancel, others: [discard, save]});
  });

  it('returns no cancel action when none is marked', () => {
    const actions: AlertAction[] = [{label: 'List'}, {label: 'Grid'}];
    expect(splitActions(actions)).toEqual({cancel: undefined, others: actions});
  });

  it('treats only the first cancel action as the dismiss action', () => {
    const first: AlertAction = {label: 'Cancel', role: 'cancel'};
    const second: AlertAction = {label: 'Later', role: 'cancel'};
    expect(splitActions([first, second])).toEqual({cancel: first, others: [second]});
  });
});

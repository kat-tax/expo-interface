import type {AlertAction} from './types';

export const DEFAULT_ACTIONS: AlertAction[] = [{label: 'OK', role: 'cancel'}];

/** Splits actions into the cancel action (at most one) and the rest. */
export function splitActions(actions: AlertAction[] = DEFAULT_ACTIONS) {
  const cancel = actions.find(action => action.role === 'cancel');
  const others = actions.filter(action => action !== cancel);
  return {cancel, others};
}

import type {AlertAction} from './types';

export const DEFAULT_ACTIONS: AlertAction[] = [{label: 'OK', role: 'cancel'}];

/**
 * The action the keyboard's action key presses from a field in the alert:
 * the first that is not `cancel`, and none while that one is disabled. It
 * does not move on to the next, which could be the destructive one.
 */
export function defaultAction(actions: AlertAction[] = DEFAULT_ACTIONS): AlertAction | undefined {
  const action = actions.find(candidate => candidate.role !== 'cancel');
  return action?.disabled ? undefined : action;
}

/** Splits actions into the cancel action (at most one) and the rest. */
export function splitActions(actions: AlertAction[] = DEFAULT_ACTIONS) {
  const cancel = actions.find(action => action.role === 'cancel');
  const others = actions.filter(action => action !== cancel);
  return {cancel, others};
}

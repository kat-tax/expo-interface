import type {ChipProps} from './types';

/**
 * Which of the two things a chip is. A `selected` prop — even `false` — says
 * the chip has a state to be in; without one it is a button that happens to
 * be capsule-shaped.
 *
 * Every platform file splits on this, and each splits into a different pair
 * of controls, which is the whole reason the component exists.
 */
export type ChipKind = 'action' | 'filter';

export function chipKind({selected}: Pick<ChipProps, 'selected'>): ChipKind {
  return selected === undefined ? 'action' : 'filter';
}

/** What the chip's state becomes when it is pressed. */
export function nextSelected({selected}: Pick<ChipProps, 'selected'>): boolean {
  return !selected;
}

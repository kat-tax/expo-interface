/** What a touch means, which the platform plays its own way (see `haptic`). */
export type HapticKind = 'lift' | 'step' | 'drop';

/** Windows: a desktop has no haptic engine to play, so nothing. */
export function haptic(_kind: HapticKind): void {}

import type {HapticKind} from './play';
import {loadHaptics, playHaptic} from './play';

const library = loadHaptics();

/**
 * Plays the feel of a touch by what it means: `lift` as something is picked
 * up (a drag starting, a long press taking hold), `step` as it passes a
 * detent (a slot, a snap point), `drop` as it is put down. iOS plays the
 * impact and selection generators; Android the haptic feedback constants,
 * `DRAG_START`, `SEGMENT_TICK` and `GESTURE_END` where the OS has them and
 * `LONG_PRESS`, `CLOCK_TICK` and `CONTEXT_CLICK` where it does not; web a
 * short vibration where the browser has one. Nothing without
 * `expo-haptics`, and nothing on Windows.
 */
export function haptic(kind: HapticKind): void {
  playHaptic(kind, library);
}

export type {HapticKind} from './play';

import type {HapticKind} from './play';
import {createHapticPacer, loadHaptics, playHaptic} from './play';

const library = loadHaptics();
const pace = createHapticPacer();

/**
 * Plays the feel of a touch by what it means: `lift` as something is picked
 * up (a drag starting, a long press taking hold), `step` as it passes a
 * detent (a slot, a snap point), `drop` as it is put down. iOS plays the
 * impact and selection generators; Android the haptic feedback constants,
 * `DRAG_START`, `SEGMENT_TICK` and `GESTURE_END` where the OS has them and
 * `LONG_PRESS`, `CLOCK_TICK` and `CONTEXT_CLICK` where it does not; web a
 * short vibration where the browser has one. Nothing without
 * `expo-haptics`, and nothing on Windows.
 *
 * Steps are paced: a `step` within 120 ms of a `lift`, or within 45 ms of
 * the last step played, plays nothing, so a drag across many slots ticks no
 * faster than a vibrator plays effects apart (Android's plays one at a
 * time). `lift` and `drop` always play.
 */
export function haptic(kind: HapticKind): void {
  // A monotonic clock: a wall clock set back would hold every step until it caught up.
  if (pace(kind, performance.now())) playHaptic(kind, library);
}

export type {HapticKind} from './play';

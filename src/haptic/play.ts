import type * as Haptics from 'expo-haptics';
import {Platform} from 'react-native';

/** What a touch means, which the platform plays its own way (see `haptic`). */
export type HapticKind = 'lift' | 'step' | 'drop';

/** The parts of `expo-haptics` the kit plays. */
export type HapticsLibrary = Pick<typeof Haptics, 'AndroidHaptics' | 'ImpactFeedbackStyle' | 'impactAsync' | 'selectionAsync' | 'performAndroidHapticsAsync'>;

/**
 * `expo-haptics`, when the app has it (an optional peer): the `require`
 * sits in a `try` so Metro treats the dependency as optional and a bundle
 * without it still builds.
 */
export function loadHaptics(load: () => HapticsLibrary = requireHaptics): HapticsLibrary | null {
  try {
    return load();
  } catch {
    return null;
  }
}

function requireHaptics(): HapticsLibrary {
  // eslint-disable-next-line typescript/no-require-imports -- optional peer, resolved only when installed.
  return require('expo-haptics') as HapticsLibrary;
}

/**
 * Android's constants for each kind: the one the platform added for it
 * (API 30 and 34), and the older one a device without it plays instead.
 */
const ANDROID = {
  lift: ['Drag_Start', 'Long_Press'],
  step: ['Segment_Tick', 'Clock_Tick'],
  drop: ['Gesture_End', 'Context_Click'],
} as const;

/** Plays a kind through the library, if there is one; a failure to play is no one's concern. */
export function playHaptic(kind: HapticKind, library: HapticsLibrary | null): void {
  if (!library) return;
  const {AndroidHaptics, ImpactFeedbackStyle} = library;
  if (Platform.OS === 'android') {
    const [wanted, older] = ANDROID[kind];
    library.performAndroidHapticsAsync(AndroidHaptics[wanted])
      .catch(() => library.performAndroidHapticsAsync(AndroidHaptics[older]))
      .catch(() => {});
    return;
  }
  const played = kind === 'step'
    ? library.selectionAsync()
    : library.impactAsync(kind === 'lift' ? ImpactFeedbackStyle.Medium : ImpactFeedbackStyle.Light);
  played.catch(() => {});
}

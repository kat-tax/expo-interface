import {Platform} from 'react-native';

/** What a touch means, which the platform plays its own way (see `haptic`). */
export type HapticKind = 'lift' | 'step' | 'drop';

/** The Android constants the kit plays, by their names in `expo-haptics`. */
type AndroidConstant = 'Drag_Start' | 'Long_Press' | 'Segment_Tick' | 'Clock_Tick' | 'Gesture_End' | 'Context_Click';

/**
 * The parts of `expo-haptics` the kit plays, described here rather than
 * imported, so the kit builds without the package.
 */
export interface HapticsLibrary {
  AndroidHaptics: Record<AndroidConstant, string>;
  ImpactFeedbackStyle: {Light: string; Medium: string};
  impactAsync(style: string): Promise<void>;
  selectionAsync(): Promise<void>;
  performAndroidHapticsAsync(type: string): Promise<void>;
}

/**
 * `expo-haptics`, when the app has it (an optional peer), or the library a
 * test hands in. The `require` sits in the `try` itself, which is what makes
 * Metro treat it as optional: a bundle without the package still builds.
 */
export function loadHaptics(load?: () => HapticsLibrary): HapticsLibrary | null {
  try {
    // eslint-disable-next-line typescript/no-require-imports -- optional peer, resolved only when installed.
    return load ? load() : (require('expo-haptics') as HapticsLibrary);
  } catch {
    return null;
  }
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

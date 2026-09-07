import type {ViewStyle} from 'react-native';

/** How far a pressable surface dims while it is held down. */
export const PRESSED_OPACITY = 0.7;

const PRESSED: ViewStyle = {opacity: PRESSED_OPACITY};

/** The feedback a pressable `Surface` adds while it is held down. */
export function pressFeedback({pressed}: {pressed: boolean}): ViewStyle | null {
  return pressed ? PRESSED : null;
}

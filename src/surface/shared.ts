import type {ViewStyle} from 'react-native';
import type {Feedback, PressState} from './types';

/** How far a pressable surface dims while it is held down. */
export const PRESSED_OPACITY = 0.7;

const PRESSED: ViewStyle = {opacity: PRESSED_OPACITY};

/**
 * The feedback a pressable `Surface` adds while it is held down: iOS,
 * Android and web dim it. `feedback` names the fill Windows draws instead
 * (see `shared.windows.ts`); here every kind dims the same way, and a
 * hovered pointer changes nothing.
 */
export function pressFeedback({pressed}: PressState, feedback: Feedback = 'subtle'): ViewStyle | null {
  return pressed ? PRESSED : null;
}

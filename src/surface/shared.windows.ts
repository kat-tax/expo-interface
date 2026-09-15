import type {ViewStyle} from 'react-native';
import type {Feedback, PressState} from './types';
import {PlatformColor} from 'react-native';

/** How far an accent-filled pressable dims while it is held down, and while hovered. */
export const PRESSED_OPACITY = 0.7;
export const HOVERED_OPACITY = 0.9;

/**
 * WinUI's state fills: a control (a card, a filled box) goes from its
 * default fill to the secondary one under the pointer and the tertiary one
 * while pressed; a bare row (a list item, a header button) takes the subtle
 * fills, which are translucent over whatever is behind. Each resolves per
 * scheme and in high contrast, as the theme's own colors do.
 */
const FILLS = {
  control: {
    hovered: PlatformColor('ControlFillColorSecondary'),
    pressed: PlatformColor('ControlFillColorTertiary'),
  },
  subtle: {
    hovered: PlatformColor('SubtleFillColorSecondary'),
    pressed: PlatformColor('SubtleFillColorSecondary'),
  },
};

/**
 * Windows: the feedback a drawn pressable adds, as WinUI draws it — the
 * state fill of its kind while hovered and while pressed, or, for a surface
 * in the accent color, a dim, since a fill would hide the accent.
 */
export function pressFeedback({pressed, hovered}: PressState, feedback: Feedback = 'subtle'): ViewStyle | null {
  if (feedback === 'accent') {
    return pressed ? {opacity: PRESSED_OPACITY} : hovered ? {opacity: HOVERED_OPACITY} : null;
  }
  const fills = FILLS[feedback];
  return pressed ? {backgroundColor: fills.pressed} : hovered ? {backgroundColor: fills.hovered} : null;
}

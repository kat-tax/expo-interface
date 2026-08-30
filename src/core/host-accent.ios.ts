import {tint} from '@expo/ui/swift-ui/modifiers';

/**
 * iOS: apply the accent seed as a Host-level SwiftUI `tint`, which cascades
 * to every SwiftUI child (buttons, pickers, switches, text fields).
 */
export function hostAccentProps(seed: string) {
  return {modifiers: [tint(seed)]};
}

import type {IconToken} from '../icons';

/**
 * A small, rounded thing you press: a filter across the top of a list, a tag
 * on a row, a suggestion under a field.
 *
 * Only Android has a control called a chip — Material's four — and the kit
 * uses three of them. The other platforms have no such control and have never
 * needed one, because a chip is a small capsule button that may be on or off,
 * and each of them has that:
 *
 * - Android: Compose's `FilterChip`, `AssistChip` and `SuggestionChip`.
 * - iOS: a SwiftUI `Toggle` in its button style when the chip can be off, and
 *   a capsule `Button` when it cannot. The toggle is what gives VoiceOver the
 *   on/off state; a button that merely changes colour would not have it.
 * - Windows: a WinUI 3 `ToggleButton` with a pill radius, or a pill `Button` —
 *   the same split, and the same reason. UI Automation reports the toggle
 *   pattern from the first and a plain invoke from the second.
 * - Web: a `<button>` with `aria-pressed`, which is exactly the toggle-button
 *   pattern the APG describes.
 *
 * What is deliberately missing is Material's **input** chip — the one with a
 * remove cross. It is the only chip kind no other platform has any control
 * for, and drawing it on the other three would be the kit drawing a chip
 * rather than using one.
 */
export interface ChipProps {
  /** Text in the chip, and what a screen reader says. */
  label: string;
  /** Called when the chip is pressed, with what its state would become. */
  onPress?: (selected: boolean) => void;
  /**
   * Whether the chip is on. Giving it at all makes the chip a thing that can
   * be off — a filter — and leaving it out makes it an action.
   */
  selected?: boolean;
  /** Leading icon. */
  icon?: IconToken;
  disabled?: boolean;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

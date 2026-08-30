import type {ReactNode} from 'react';

/**
 * Cross-platform tooltip: a short hint attached to a piece of content.
 *
 * - Web: a native `popover="hint"` shown by the Interest Invoker API
 *   (`interestfor` — hover, keyboard focus or touch long-press), laid out with
 *   CSS anchor positioning; browsers without it fall back to the `title`
 *   attribute, the platform's built-in tooltip.
 * - Android: the Jetpack Compose Material 3 `TooltipBox` / `PlainTooltip`
 *   shown on long-press.
 * - iOS: iOS has no tooltip idiom; `children` render as-is and `text` is
 *   exposed to VoiceOver as an accessibility hint.
 *
 * `children` should be non-interactive content (an icon, a label): the web
 * trigger is a `<button>`, and buttons can't nest.
 */
export interface TooltipProps {
  /** Hint text. */
  text: string;
  /** Content the tooltip is attached to. Must be native (`@expo/ui`) content on Android. */
  children: ReactNode;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

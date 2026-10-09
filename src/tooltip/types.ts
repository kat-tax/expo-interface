import type {ReactNode} from 'react';
import type {MaterialThickness} from '../material/types';

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
  /**
   * Web only: the material the hint draws on, by the rules the bars use
   * (the raised fill thinned over a blur, with a hairline and the floating
   * shadow all round), with the text in the label color rather than the
   * inverted hint's. The app's `overlayMaterial` (`AccentProvider`) unless
   * given. The native tooltips are the platforms' own.
   */
  material?: MaterialThickness;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

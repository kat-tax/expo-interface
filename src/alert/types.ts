import type {ReactNode} from 'react';

/**
 * Semantic role of an alert action. `cancel` is the dismissive action (bold
 * on iOS, the dismiss slot on Android); `destructive` is rendered in the
 * danger color.
 */
export type AlertActionRole = 'default' | 'cancel' | 'destructive';

export interface AlertAction {
  /** Button text. */
  label: string;
  /**
   * Role of the action.
   * @default 'default'
   */
  role?: AlertActionRole;
  /** Called when the action is pressed; the alert then closes. */
  onPress?: () => void;
}

/**
 * Cross-platform alert dialog.
 *
 * Bridges the SwiftUI `Alert` (or `ConfirmationDialog` action sheet with
 * `sheet`) on iOS, the Jetpack Compose Material 3 `AlertDialog` on Android,
 * and the HTML `<dialog>` element on web. Presentation is controlled: set
 * `visible` and clear it from `onDismiss`, which fires whenever the alert
 * closes — after any action, or when the user dismisses it.
 */
export interface AlertProps {
  /** Title shown at the top of the alert. */
  title: string;
  /** Optional body text under the title. */
  message?: string;
  /** Whether the alert is presented. */
  visible: boolean;
  /** Called when the alert closes for any reason. */
  onDismiss?: () => void;
  /**
   * Buttons shown in the alert.
   * @default [{label: 'OK', role: 'cancel'}]
   */
  actions?: AlertAction[];
  /**
   * Present as an action sheet (iOS `confirmationDialog`, bottom-anchored on
   * web) with actions stacked vertically, instead of a centered alert.
   */
  sheet?: boolean;
  /**
   * Optional trigger rendered in place (for example the `Button` that opens
   * the alert). SwiftUI presents alerts from a view in the hierarchy, so on
   * iOS an invisible zero-size anchor is used when no trigger is given.
   */
  children?: ReactNode;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

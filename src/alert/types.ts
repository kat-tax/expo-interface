import type {ReactNode} from 'react';
import type {MaterialThickness} from '../material/types';
import type {TextFieldCapitalize, TextFieldKeyboard} from '../text-field/types';

/**
 * A text field in an alert, for the one-field prompts: a name for a new
 * thing, a rename, an identifier to open. Controlled through `value` and
 * `onChangeText`, so the action that reads it has it.
 */
export interface AlertInput {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: TextFieldKeyboard;
  autoCapitalize?: TextFieldCapitalize;
  /**
   * Offers corrections and checks spelling as the user types; off for a
   * name, an identifier or a code.
   * @default true
   */
  autoCorrect?: boolean;
  /**
   * Focuses the field as the alert opens.
   * @default true
   */
  autoFocus?: boolean;
  testID?: string;
}

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
  /**
   * Greys the action out and ignores presses: an action that waits for a
   * value, a Rename while the name is empty. The keyboard's action key in
   * the field does not press it either. A disabled action does not hold
   * the alert open: on Android the back gesture and a press outside it, on
   * web Escape and a press on the backdrop, and on Windows Escape still
   * dismiss it and report `onDismiss`, even with the cancel action
   * disabled. An iOS alert (not a `sheet`, which a press outside also
   * closes) closes only through its actions, so keep its cancel action
   * enabled.
   */
  disabled?: boolean;
  /** Called when the action is pressed; the alert then closes. */
  onPress?: () => void;
}

/**
 * Cross-platform alert dialog.
 *
 * Bridges the SwiftUI `Alert` (or `ConfirmationDialog` action sheet with
 * `sheet`) on iOS, the Jetpack Compose Material 3 `AlertDialog` on Android,
 * and the HTML `<dialog>` element on web. Presentation is controlled: set
 * `visible` and clear it from `onDismiss`, which fires when the alert
 * closes after an action or when the user dismisses it. Clearing `visible`
 * closes it without a report.
 */
export interface AlertProps {
  /** Title shown at the top of the alert. */
  title: string;
  /** Optional body text under the title. */
  message?: string;
  /** Whether the alert is presented. */
  visible: boolean;
  /**
   * Called when the alert closes after an action or when the user dismisses
   * it; not when the app closes it by clearing `visible`.
   */
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
   * A text field in the alert, for the one-field prompts: SwiftUI's alert
   * with a `TextField` among its actions, Compose's `AlertDialog` with
   * Material's outlined field under the message, a field in the web dialog
   * and one in the WinUI dialog's body. On web and Windows the keyboard's action key presses the
   * first action that is not `cancel`, and nothing while that action is
   * disabled. An action sheet (`sheet`) holds no field.
   */
  input?: AlertInput;
  /**
   * Optional trigger rendered in place (for example the `Button` that opens
   * the alert). SwiftUI presents alerts from a view in the hierarchy, so on
   * iOS an invisible zero-size anchor is used when no trigger is given.
   * Native content when the alert sits inside a host (`Screen native`, a
   * `NativeHost`), React Native content when it does not. Outside a host the
   * alert mounts one of its own for the dialog alone.
   */
  children?: ReactNode;
  /**
   * Web only: the material the dialog draws on, by the rules the bars use
   * (the raised fill thinned over a blur of the page under the backdrop,
   * with a hairline and the floating shadow all round). The app's
   * `overlayMaterial` (`AccentProvider`) unless given. The native alerts
   * are the platforms' own.
   */
  material?: MaterialThickness;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

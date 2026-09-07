/**
 * A brief message over the screen: "Copied", "3 files added", "Offline".
 *
 * Android shows the Material 3 `Snackbar` — the platform's own, queued and
 * timed by Compose. iOS and web have no such control, so the kit draws the
 * capsule Apple's own apps draw, announced to assistive technology as a
 * live region. Controlled: it is shown while `visible`, and reports
 * `onDismiss` when its time is up so the caller can put it away.
 */
export interface ToastProps {
  /** The message. */
  message: string;
  /** Whether the toast is showing. */
  visible: boolean;
  /** An optional action button, e.g. "Undo". */
  action?: {label: string; onPress: () => void};
  /** Called when the toast's time is up, or its action is taken. */
  onDismiss?: () => void;
  /**
   * How long the message stays, in milliseconds. Android rounds it to the
   * platform's short (4s) or long (10s) duration.
   * @default 4000
   */
  duration?: number;
  /** Identifier used to locate the toast in end-to-end tests. */
  testID?: string;
}

/** Android's long-snackbar threshold, and the timer the drawn toast uses. */
export const TOAST_DURATION = 4000;

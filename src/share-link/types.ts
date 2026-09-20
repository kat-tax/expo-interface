import type {IconToken} from '../icons';
import type {ButtonProps} from '../button/types';

/**
 * A button that hands something to the platform's share sheet.
 *
 * - **iOS** — SwiftUI's own `ShareLink`, so the button is the system's and the
 *   sheet is presented by it rather than by the app.
 * - **Android** — React Native's `Share`, which is `Intent.ACTION_SEND`.
 * - **Web** — react-native-web's `Share`, which is `navigator.share`.
 * - **Windows** — the kit's own module over `DataTransferManager`, because
 *   React Native's `Share` only dispatches on `ios` and `android`.
 *   **Unverified.** The module builds and is registered, and the button
 *   presses, but no sheet appeared in an unpackaged Release build and nothing
 *   was logged. The cause was not determined; package identity is the first
 *   thing to rule out, since it is what stops other Windows APIs in the same
 *   harness. `onShare` reports `false` when the sheet cannot open, so an app
 *   can say so rather than appear to have shared nothing.
 *
 * Native on iOS, Android and web, through three different doors, and a fourth
 * on Windows that has not been seen working.
 */
export interface ShareLinkProps extends Pick<ButtonProps, 'variant' | 'size' | 'shape' | 'tone' | 'color' | 'disabled' | 'hideLabel'> {
  /** The button's text, and the name a screen reader gives it. */
  label: string;
  /** The link being shared. */
  url?: string;
  /** A message to share, with or instead of the link. */
  message?: string;
  /** What the sheet calls the thing being shared. Defaults to `label`. */
  title?: string;
  icon?: IconToken;
  /**
   * Called once the sheet has been asked for, with whether the platform could
   * open one. It is not a report of what the person then did: no platform
   * here tells the app which target was chosen, or whether they changed their
   * mind.
   */
  onShare?: (opened: boolean) => void;
  testID?: string;
}

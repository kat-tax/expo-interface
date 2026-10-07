import type {StyleProp, ViewStyle} from 'react-native';

/**
 * A capsule to write a message in, with a send button that is a stop button
 * while something runs: the bottom of a conversation, a comment thread, an
 * assistant's prompt.
 *
 * Drawn in React Native on every platform, in a `Surface` capsule holding a
 * bare `TextField` and the kit's circle `Button`, so it can sit in a
 * `Sheet`'s footer or at the bottom of a screen.
 */
export interface ComposerProps {
  /** Current text (controlled). When omitted the composer keeps its own state and clears it on send. */
  value?: string;
  /** Called whenever the text changes. */
  onChangeText?: (text: string) => void;
  /** Placeholder shown while the field is empty, doubling as its accessible name. */
  placeholder?: string;
  /**
   * Called with the trimmed text when the send button is pressed or the
   * keyboard's send key is used. Nothing is sent while the text is blank.
   */
  onSend: (text: string) => void;
  /** Called when the stop button is pressed while `busy`. Without it the button is disabled while busy. */
  onStop?: () => void;
  /**
   * Something is running on what was sent: the send button is a stop
   * button, and the text can be written on meanwhile.
   * @default false
   */
  busy?: boolean;
  /** A line under the capsule in the secondary color: a hint, an error, who else is typing. */
  notice?: string;
  /** Disables writing and sending. */
  disabled?: boolean;
  /** Focuses the field once it is mounted. */
  autoFocus?: boolean;
  /** Maximum number of characters. */
  maxLength?: number;
  /** Identifier used to locate the composer in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

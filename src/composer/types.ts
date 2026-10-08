import type {StyleProp, ViewStyle} from 'react-native';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import type {TextFieldCapitalize, TextFieldKeyboard} from '../text-field/types';

/** The color of the line under a composer: `destructive` for an error. */
export type ComposerNoticeColor = 'secondaryLabel' | 'destructive';

/** The menu at a composer's leading edge: what the message goes to, a model, an attachment. */
export interface ComposerMenu {
  /** The menu's accessible name. */
  label: string;
  /** The icon the menu's button shows. */
  icon: IconToken;
  items: MenuItem[];
}

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
   * keyboard's send key is used. Nothing is sent while the text is blank or
   * while `busy`.
   */
  onSend: (text: string) => void;
  /** Called when the stop button is pressed while `busy`. Without it the button is disabled while busy. */
  onStop?: () => void;
  /**
   * Something is running on what was sent: the send button is a stop
   * button, and the text can be written on meanwhile. Enter and the
   * keyboard's send key wait until it is done; the text stays.
   * @default false
   */
  busy?: boolean;
  /** A line under the capsule: a hint, an error, who else is typing. Drawn in `noticeColor`. */
  notice?: string;
  /**
   * The color of the `notice`: `destructive` for an error.
   * @default 'secondaryLabel'
   */
  noticeColor?: ComposerNoticeColor;
  /**
   * The send button's accessible name; the button shows its icon alone.
   * @default 'Send'
   */
  sendLabel?: string;
  /**
   * The stop button's accessible name; the button shows its icon alone.
   * @default 'Stop'
   */
  stopLabel?: string;
  /**
   * The send button's icon. Defaults to the kit's arrow. On Windows a token
   * with no `windows` glyph shows `sendLabel` in its place.
   */
  sendIcon?: IconToken;
  /**
   * The stop button's icon. Defaults to the kit's stop square. On Windows a
   * token with no `windows` glyph shows `stopLabel` in its place.
   */
  stopIcon?: IconToken;
  /**
   * Called on a key pressed in the field, with the key's name (`Escape`,
   * `a`) and whether Shift was held, as `TextField`'s: Escape to close an
   * assistant built on the composer. On web the Enter that sends stays the
   * composer's and is not reported. iOS and Android report only the keys
   * that write, Enter and Backspace, so no Escape; react-native-windows
   * reports no Shift.
   */
  onKeyPress?: (key: string, shiftKey: boolean) => void;
  /**
   * Automatic capitalization of the field, as on a `TextField`.
   * @default 'sentences'
   */
  autoCapitalize?: TextFieldCapitalize;
  /**
   * Autocorrect and spellcheck suggestions in the field, as on a `TextField`.
   * @default true
   */
  autoCorrect?: boolean;
  /**
   * The keyboard the field shows, as on a `TextField`.
   * @default 'default'
   */
  keyboardType?: TextFieldKeyboard;
  /**
   * A menu at the capsule's leading edge: what the message goes to, a
   * model, an attachment. The platform's menu behind an icon button.
   */
  menu?: ComposerMenu;
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

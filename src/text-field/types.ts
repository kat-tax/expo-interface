import type {StyleProp, TextStyle} from 'react-native';

/** Keyboard variant shown while editing, conformed across platforms. */
export type TextFieldKeyboard =
  | 'default'
  | 'email'
  | 'number'
  | 'phone'
  | 'decimal'
  | 'url';

/** Automatic capitalization behaviour while typing. */
export type TextFieldCapitalize = 'none' | 'sentences' | 'words' | 'characters';

/** What the keyboard's action key says, and reports through `onSubmit`. */
export type TextFieldReturnKey = 'done' | 'go' | 'next' | 'search' | 'send';

/**
 * What happens to the focus when the action key is pressed. `blurAndSubmit`
 * closes the keyboard; `submit` keeps the field focused so the next press
 * submits again (an inline search stepping through its matches).
 */
export type TextFieldSubmitBehavior = 'blurAndSubmit' | 'submit';

/**
 * How the field is drawn. `row` is the native form row (SwiftUI `TextField`,
 * a Compose `TextField` stripped of its container) meant for a
 * `FieldGroup.Section`; `inline` is a borderless React Native `TextInput` on
 * every platform, for a field that sits inside a React Native layout (a
 * search row in a toolbar) where the native control would need a host.
 */
export type TextFieldVariant = 'row' | 'inline';

/**
 * Cross-platform single/multi-line text input with a conformed iOS-style
 * appearance — a borderless field whose placeholder doubles as the row label,
 * exactly the SwiftUI `Form` row look the other platforms emulate. Drop it
 * straight into a `FieldGroup.Section` alongside other rows.
 *
 * The control may be used controlled (pass `value` + `onChangeText`) or
 * uncontrolled (omit both and it manages its own state).
 */
export interface TextFieldProps {
  /** Placeholder shown when the field is empty, doubling as the row's label. */
  placeholder?: string;
  /** Current text (controlled). When omitted the component keeps its own state. */
  value?: string;
  /** Called whenever the text changes. */
  onChangeText?: (text: string) => void;
  /** Called when the user presses the keyboard return key. Receives the text. */
  onSubmit?: (text: string) => void;
  /**
   * Called on a key press with the key's name (`Enter`, `Escape`, `a`) and
   * whether Shift was held, for keyboard handling the platform does not
   * cover. `inline` variant only.
   */
  onKeyPress?: (key: string, shiftKey: boolean) => void;
  /** Disables editing and dims the field. */
  disabled?: boolean;
  /** Masks the input for sensitive values such as passwords. */
  secureTextEntry?: boolean;
  /**
   * Keyboard variant to display.
   * @default 'default'
   */
  keyboardType?: TextFieldKeyboard;
  /**
   * Automatic capitalization behaviour.
   * @default 'sentences'
   */
  autoCapitalize?: TextFieldCapitalize;
  /**
   * Enables autocorrect / spellcheck suggestions.
   * @default true
   */
  autoCorrect?: boolean;
  /** Allows multiple lines of input that grow vertically. */
  multiline?: boolean;
  /**
   * Focuses the field once it is mounted, and makes sure its keyboard came:
   * on Android the first focus can be asked for before the field is served
   * by the input method and dropped, so a moment later, if the keyboard is
   * still down, the field is focused again.
   */
  autoFocus?: boolean;
  /**
   * What the keyboard's action key says. The key reports through `onSubmit`.
   * @default 'done'
   */
  returnKeyType?: TextFieldReturnKey;
  /**
   * Whether the action key closes the keyboard.
   * @default 'blurAndSubmit'
   */
  submitBehavior?: TextFieldSubmitBehavior;
  /**
   * The field's look.
   * @default 'row'
   */
  variant?: TextFieldVariant;
  /** Maximum number of characters allowed. Truncates natively as the user types. */
  maxLength?: number;
  /** Tint applied to the cursor/selection (web/android) and the field (iOS). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the text content (web and the `inline` variant). */
  style?: StyleProp<TextStyle>;
}

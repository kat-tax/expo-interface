import type {Ref} from 'react';
import type {StyleProp, TextStyle} from 'react-native';

/**
 * What a `TextField` can be told to do through its `ref`: the `inline`
 * variant on every platform, and the web row, which are React Native inputs.
 * The native rows (SwiftUI, Compose and WinUI) take no commands.
 */
export interface TextFieldCommands {
  focus(): void;
  blur(): void;
}

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
 * closes the keyboard (on web, gives up the focus); `submit` keeps the field
 * focused so the next press submits again (an inline search stepping
 * through its matches).
 */
export type TextFieldSubmitBehavior = 'blurAndSubmit' | 'submit';

/**
 * How the field is drawn. `row` is the native form row (SwiftUI `TextField`,
 * a Compose `TextField` stripped of its container) meant for a
 * `FieldGroup.Section`; `inline` is a borderless React Native `TextInput` on
 * every platform, for a field that sits inside a React Native layout (a
 * search row in a toolbar) where the native control would need a host;
 * `bare` is `inline` without the field's own padding and, on web, without
 * the browser's focus ring, for a field inside a box that draws both (a
 * `Composer`'s capsule, a prompt's field).
 */
export type TextFieldVariant = 'row' | 'inline' | 'bare';

/**
 * Cross-platform single/multi-line text input with a conformed iOS-style
 * appearance: a borderless field whose placeholder doubles as the row label,
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
  /**
   * Called when the user presses the keyboard return key. Receives the text.
   * On web the browser reports Enter but not Shift+Enter (React Native Web's
   * `TextInput` keeps the modified key for a newline), so a field that walks
   * a list both ways takes the forward step here and the backward one from
   * `onKeyPress`.
   */
  onSubmit?: (text: string) => void;
  /**
   * Called on a key press with the key's name (`Enter`, `Escape`, `a`) and
   * whether Shift was held, for keyboard handling the platform does not
   * cover. The `inline` variant and the web and Windows rows. In `inline`,
   * iOS and Android report only the keys that write, Enter and Backspace;
   * react-native-windows reports only the keys that type a character,
   * Escape and Backspace among them, never an Enter that submits (in a
   * one-line field, every Enter), and no Shift.
   */
  onKeyPress?: (key: string, shiftKey: boolean) => void;
  /** Called when the field takes the focus. `inline` variant and the web row only. */
  onFocus?: () => void;
  /** Called when the field gives up the focus. `inline` variant and the web row only. */
  onBlur?: () => void;
  /** The commands, see {@link TextFieldCommands}. */
  ref?: Ref<TextFieldCommands>;
  /** Disables editing and dims the field. */
  disabled?: boolean;
  /** Masks the input for sensitive values such as passwords. */
  secureTextEntry?: boolean;
  /**
   * Keyboard variant to display. On web it is also the field's `inputmode`,
   * which a multi-line field takes. In `inline` on Windows it has no
   * effect: react-native-windows ignores it.
   * @default 'default'
   */
  keyboardType?: TextFieldKeyboard;
  /**
   * Automatic capitalization behaviour. The Windows row has no equivalent,
   * and in `inline` on Windows only `characters` applies.
   * @default 'sentences'
   */
  autoCapitalize?: TextFieldCapitalize;
  /**
   * Enables autocorrect / spellcheck suggestions.
   * @default true
   */
  autoCorrect?: boolean;
  /**
   * Allows multiple lines of input that grow vertically. On web an `inline`
   * field is a `<textarea>` one row tall: a browser that sizes a field to
   * its content (`field-sizing`) grows it with its lines up to its
   * `maxHeight`, and one that does not scrolls inside the row.
   */
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
   * Whether the action key closes the keyboard. Honoured on web and in
   * `inline` on iOS and Android; there, left out, a one-line field closes
   * it as it submits and a multi-line field breaks the line. The native
   * rows keep the platform's own way (the Compose row keeps the focus). On
   * Windows Enter submits and keeps the focus, and a multi-line `inline`
   * field given one submits on Enter and breaks the line on Shift+Enter.
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

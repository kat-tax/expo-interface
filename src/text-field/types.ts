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
  /** Focuses the field automatically when mounted. */
  autoFocus?: boolean;
  /** Maximum number of characters allowed. Truncates natively as the user types. */
  maxLength?: number;
  /** Tint applied to the cursor/selection (web/android) and the field (iOS). */
  accentColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  /** Style applied to the text content (web only). */
  style?: StyleProp<TextStyle>;
}

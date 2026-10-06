import type {Ref} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {TextFieldCapitalize} from '../text-field/types';

/** What a `SearchField` can be told to do through its `ref`. */
export interface SearchFieldCommands {
  focus(): void;
  blur(): void;
}

/**
 * A field for searching: the query box, a way to clear it, and optionally a
 * list of completions under it.
 *
 * - Windows: a WinUI 3 `AutoSuggestBox`, which draws the box, the clear
 *   button and the suggestion list the system places and sizes.
 * - Web: `<input type="search">` with a `<datalist>`. The browser's own
 *   combobox, so the hardest keyboard pattern in the APG is the platform's
 *   problem rather than the kit's — the same reasoning that made `Picker` a
 *   `<select>` and `Alert` a `<dialog>`. Plain text only: a `<datalist>`
 *   entry cannot carry an icon.
 * - iOS and Android: the kit's own `TextField` with a magnifier beside it,
 *   and the completions drawn under it.
 *
 * Android is composed rather than native on purpose. Compose's `SearchBar`
 * and `DockedSearchBar` take an `onQueryChange` and no `query`, so the text
 * they hold cannot be set or cleared from outside. Every other input in the
 * kit is controlled, and a `value` that silently does nothing on one platform
 * is the failure this kit exists to avoid.
 */
export interface SearchFieldProps {
  /** What is in the box. The kit owns it on every platform. */
  value: string;
  onChangeText: (text: string) => void;
  /** Enter, the platform's search key, or a completion taken from the list. */
  onSubmit?: (text: string) => void;
  /** Shown while the box is empty, and used as its accessible name. */
  placeholder?: string;
  /**
   * Completions offered as the text is typed, filtered to what it contains.
   * Without any, the field is a plain search box.
   */
  suggestions?: string[];
  disabled?: boolean;
  /**
   * Draw the clear button while there is something to clear.
   * @default true
   */
  clearable?: boolean;
  /** Focuses the box once it is mounted. */
  autoFocus?: boolean;
  /** Automatic capitalization while typing; the platform's default when omitted. Windows has no equivalent. */
  autoCapitalize?: TextFieldCapitalize;
  onFocus?: () => void;
  onBlur?: () => void;
  /** A key pressed in the box, by its name (`Enter`, `Escape`, `a`). */
  onKeyPress?: (key: string) => void;
  /** The commands, see {@link SearchFieldCommands}. */
  ref?: Ref<SearchFieldCommands>;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

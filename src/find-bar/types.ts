import type {StyleProp, ViewStyle} from 'react-native';
import type {ToolbarPlacement} from '../toolbar/types';

/** Where the find has got to: the match the app is showing, counting from 1, of how many. */
export interface FindBarMatches {
  current: number;
  total: number;
}

/**
 * A bar to find text in what a screen shows: an editor, a document, a web
 * page. A field, the count of matches, previous and next, and close, at the
 * bar's metrics; the finding itself is the app's, which hands back where it
 * has got to through `matches`.
 *
 * Drawn on every platform as the kit's `Toolbar` with an inline field. iOS
 * has a system find bar, `UIFindInteraction`, but it belongs to a
 * `UITextView` or a `WKWebView`, which React Native content is not, and no
 * module the kit stands on reaches it.
 */
export interface FindBarProps {
  /** The text to find (controlled). When omitted the bar keeps its own. */
  value?: string;
  /** Called as the text changes: the app finds it and says where it got to through `matches`. */
  onChangeText?: (text: string) => void;
  /**
   * The field's placeholder and accessible name.
   * @default 'Find'
   */
  placeholder?: string;
  /**
   * Where the find has got to. Drawn as "3 of 12", or "No matches" when
   * there are none for the text; nothing before the app has looked.
   * Previous and next are disabled with no matches.
   */
  matches?: FindBarMatches | null;
  /** The next match: the next button, the keyboard's search key, Enter. */
  onNext?: () => void;
  /** The previous match: the previous button, Shift+Enter. */
  onPrevious?: () => void;
  /** Close the bar: the close button, Escape. */
  onClose?: () => void;
  /**
   * Focuses the field once the bar is mounted, as a find bar opened by a
   * command is.
   * @default true
   */
  autoFocus?: boolean;
  /**
   * Which edge the bar sits on.
   * @default 'top'
   */
  placement?: ToolbarPlacement;
  /** Identifier used to locate the bar in end-to-end tests; the field is `${testID}-field`. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

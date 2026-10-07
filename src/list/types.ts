import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/**
 * A list of rows that grows: the inbox, the versions of a document, the
 * licences, the members of a space. The rows are `ListItem`s, and the list
 * is the platform's own lazy one, so three thousand rows cost what the
 * screen shows.
 *
 * - iOS: SwiftUI `List`, in the plain style, which draws its separators and
 *   recycles its rows.
 * - Android: Compose `LazyColumn`, with a Material divider between rows.
 * - Web: a DOM list whose rows the browser lays out as they come into view
 *   (`content-visibility: auto`).
 * - Windows: React Native's `FlatList`, windowed.
 *
 * On iOS and Android a row is native content, as a row in a `FieldGroup`
 * is: the kit's `ListItem` with its slots, or `@expo/ui` content. A React
 * Native view inside a row is hosted a second time each time the lazy list
 * recycles it, so a row that needs one belongs in a `CardGrid`, which is
 * drawn in React Native.
 */
export interface ListProps<T> {
  /** The rows' data, in order. */
  data: readonly T[];
  /** One row, usually a `ListItem`. */
  renderItem: (item: T, index: number) => ReactNode;
  /** A stable key per item; the index when left out. */
  keyExtractor?: (item: T, index: number) => string;
  /**
   * A hairline between the rows.
   * @default true
   */
  separators?: boolean;
  /**
   * Content above the first row and below the last: a title, a count, a
   * button that loads more. Native content on iOS and Android, as the rows
   * are.
   */
  header?: ReactNode;
  footer?: ReactNode;
  /** What the list shows in place of its rows when `data` is empty: usually an `EmptyState`. */
  empty?: ReactNode;
  /** Called once the last row has been drawn, for a list that loads more. */
  onEndReached?: () => void;
  /**
   * A row's height, in points, where the rows are alike: what the web lays
   * out for a row before it has come into view, and what Windows jumps by.
   * @default 56
   */
  estimatedItemHeight?: number;
  /** The space inside the list before the first row and after the last, in points. */
  contentInset?: {top?: number; bottom?: number};
  /** Identifier used to locate the list in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/**
 * A list of rows that grows: the inbox, the versions of a document, the
 * licences, the members of a space. The rows are `ListItem`s, and the list
 * is the platform's own lazy one, which draws only the rows on screen. The
 * web and Windows render only the rows near the view; on iOS and Android
 * React renders every row and the native list keeps a view for each, so a
 * very long list there is better loaded a page at a time with
 * `onEndReached`.
 *
 * - iOS: SwiftUI `List`, in the plain style, which draws its separators and
 *   recycles its rows.
 * - Android: Compose `LazyColumn`, with a Material divider between rows.
 * - Web: a DOM list that scrolls itself and draws only the rows near the
 *   view, two spacers keeping the room of the rest at their measured
 *   heights once seen and at `estimatedItemHeight` before. A focused row
 *   scrolled more than a viewport out of view is removed, and the focus
 *   with it. Only the drawn rows are in the page, so find in page, printing
 *   and a scroll to a row's element reach only those, and a static page
 *   holds only the rows that fill 1200 pixels at `estimatedItemHeight`.
 * - Windows: React Native's `FlatList`, windowed.
 *
 * Every platform's list scrolls itself and fills the space its parent gives
 * it (a `Screen`'s content, a view with `flex: 1`). On iOS, Android and
 * Windows that parent needs a height of its own: inside a scroll view the
 * iOS and Android list gets no height, and the Windows list grows to its
 * rows, so it draws every one of them and is no longer windowed. On the web,
 * in a parent with no height of its own, it grows to its rows and the parent
 * scrolls it; `style={{flexShrink: 0}}` does the same in a parent that has a
 * height.
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
  /**
   * What the list shows in place of its rows when `data` is empty: usually
   * an `EmptyState`, which fills the list. On iOS and Android outside a host
   * it is placed in the list's own view with no host around it, so a control
   * in it mounts its own; under a host it is native content, as the rows
   * are. iOS and Android show it without the `header` and `footer`; the web
   * and Windows keep them around it.
   */
  empty?: ReactNode;
  /** Called once the last row has been drawn, for a list that loads more. */
  onEndReached?: () => void;
  /**
   * A row's height, in points, before the web has measured it: what the
   * web's window counts a row it has not drawn yet as. iOS, Android and
   * Windows measure their rows.
   * @default 56
   */
  estimatedItemHeight?: number;
  /**
   * The space inside the list before the first row, after the last, and at
   * each side of the rows, in points. On iOS the top and the bottom are rows
   * of the SwiftUI `List`, and the sides inset the list as a whole, since
   * `@expo/ui` has no content margins for a scroll view.
   */
  contentInset?: {top?: number; bottom?: number; left?: number; right?: number};
  /** Identifier used to locate the list in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

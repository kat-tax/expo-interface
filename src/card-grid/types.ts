import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/**
 * A grid of cards that grows: the documents of a workspace, the photos of a
 * drop, the spaces on a dashboard. The columns come from the width: as many
 * cards of at least `minItemWidth` as fit, up to `maxColumns`, so a phone
 * holds two and a desk four without the app measuring anything. The cells
 * are drawn only as they come into view, so three thousand cards cost what
 * the screen shows.
 *
 * - iOS, Android, Windows: React Native's `FlatList`, windowed, with the
 *   column count worked out from the measured width.
 * - Web: a CSS grid that scrolls itself and draws only the rows of cells
 *   near the view, two spacers keeping the room of the rest at their
 *   measured heights once seen and at `estimatedItemHeight` before. Only the
 *   drawn cells are in the page, so find in page, printing and a scroll to a
 *   card's element reach only those, and a static page holds only the rows
 *   that fill 1200 pixels at `estimatedItemHeight`.
 *
 * Every platform's grid scrolls itself and fills the space its parent gives
 * it (a `Screen`'s content, a view with `flex: 1`). On iOS, Android and
 * Windows that parent needs a height of its own: inside a scroll view the
 * grid grows to its rows, so it draws every one of them and is no longer
 * windowed. On the web, in a parent with no height of its own, it grows to
 * its cells and the parent scrolls it; `style={{flexShrink: 0}}` does the
 * same in a parent that has a height.
 *
 * Drawn in React Native on every platform, like `Card`, because a card holds
 * what is not native: a preview, a thumbnail. A list of rows is `List`.
 */
export interface CardGridProps<T> {
  /** The cards' data, in order. */
  data: readonly T[];
  /** One cell, usually a `Card`. It fills the cell's width. */
  renderItem: (item: T, index: number) => ReactNode;
  /** A stable key per item; the index when left out. */
  keyExtractor?: (item: T, index: number) => string;
  /**
   * The narrowest a cell goes, in points. The grid fits as many columns of
   * at least this as the width allows.
   * @default 150
   */
  minItemWidth?: number;
  /**
   * The most columns the grid takes, however wide it is. A fraction counts
   * down to a whole number, and anything under one is one.
   * @default 4
   */
  maxColumns?: number;
  /**
   * The space between the cells, in points, on both axes.
   * @default 12
   */
  gap?: number;
  /** Content above the first row of cells and below the last. */
  header?: ReactNode;
  footer?: ReactNode;
  /** What the grid shows in place of its cells when `data` is empty: usually an `EmptyState`, which fills the grid. */
  empty?: ReactNode;
  /** Called once the last cells have been drawn, for a grid that loads more. */
  onEndReached?: () => void;
  /**
   * A cell's height, in points, before the web has measured it: what the
   * web's window counts a row of cells it has not drawn yet as. The native
   * `FlatList` measures its rows.
   * @default 180
   */
  estimatedItemHeight?: number;
  /** The space inside the grid before the first row and after the last, in points. */
  contentInset?: {top?: number; bottom?: number};
  /** Identifier used to locate the grid in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

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
 * - Web: a CSS grid, each cell laid out as it comes into view
 *   (`content-visibility: auto`).
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
   * The most columns the grid takes, however wide it is.
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
  /** What the grid shows in place of its cells when `data` is empty: usually an `EmptyState`. */
  empty?: ReactNode;
  /** Called once the last cells have been drawn, for a grid that loads more. */
  onEndReached?: () => void;
  /**
   * A cell's height, in points, where the cells are alike: what the web lays
   * out for a cell before it has come into view.
   * @default 180
   */
  estimatedItemHeight?: number;
  /** The space inside the grid before the first row and after the last, in points. */
  contentInset?: {top?: number; bottom?: number};
  /** Identifier used to locate the grid in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

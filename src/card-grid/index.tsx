import './card-grid.css';
import type {CSSProperties, RefObject} from 'react';
import type {CardGridProps} from './types';
import {useEffect, useEffectEvent, useLayoutEffect, useRef, useState} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {keyOf, showsEmpty} from '../list/shared';
import {useWindowed} from '../list/windowed';
import {useScrollInsets} from '../screen/insets';
import {flatten} from '../theme';
import {ESTIMATED_CELL, GAP, MAX_COLUMNS, MIN_ITEM_WIDTH, columnsFor, rowsOf} from './shared';

/**
 * The width the cells have inside the grid: its content box, without the
 * padding or a scrollbar. Null until it is measured, and while it is hidden.
 */
function useContentWidth(scroller: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    // A static render has no observer, and nothing to measure.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => setWidth(entries[0]!.contentRect.width || null));
    // The element is attached by the time an effect runs.
    observer.observe(scroller.current!);
    return () => observer.disconnect();
  }, [scroller]);
  return width;
}

/**
 * Web renders a CSS grid that scrolls itself and draws only the rows of
 * cells near the view: as many columns of at least `minItemWidth` as the
 * width holds, capped at `maxColumns`, with two spacers keeping the room of
 * the other rows at their measured heights once seen and at
 * `estimatedItemHeight` before. Once the width is measured the columns are
 * counted the way the native grid counts them and written into the grid, so
 * a drawn row is one row of the grid; until then (the static page, the first
 * paint) the stylesheet's own `repeat(auto-fill, minmax(...))` counts the
 * same columns. Each cell says where it stands in the whole (`aria-posinset`,
 * `aria-setsize`). The grid fills the room its parent gives it, with the
 * screen's insets as padding inside. The end is reached once the window
 * draws the last row, for a grid that loads more, and again when more cells
 * arrive while it is still drawn.
 */
export function CardGrid<T>({
  data,
  renderItem,
  keyExtractor,
  minItemWidth = MIN_ITEM_WIDTH,
  maxColumns = MAX_COLUMNS,
  gap = GAP,
  header,
  footer,
  empty,
  onEndReached,
  estimatedItemHeight = ESTIMATED_CELL,
  contentInset,
  testID,
  style,
}: CardGridProps<T>) {
  const insets = useScrollInsets(contentInset);
  const scroller = useRef<HTMLDivElement>(null);
  const width = useContentWidth(scroller);
  const columns = width == null ? null : columnsFor(width, minItemWidth, maxColumns, gap);
  const cut = columns ?? maxColumns;
  const rows = rowsOf(data, cut);
  // A row's height is kept per column count: other columns are other rows.
  const keys = rows.map((row, index) => `${cut}:${keyOf({keyExtractor}, row[0]!, index * cut)}`);
  const {range, start, measure} = useWindowed(scroller, {keys, estimate: estimatedItemHeight, gap});
  const reachEnd = useEffectEvent(() => onEndReached?.());
  const atEnd = rows.length > 0 && range.end === rows.length;
  useEffect(() => {
    if (atEnd) reachEnd();
  }, [atEnd, rows.length]);
  const top = insets.top || undefined;
  const bottom = insets.bottom || undefined;
  const vars = {
    '--ui-card-grid-min': `${minItemWidth}px`,
    '--ui-card-grid-gap': `${gap}px`,
    // The cap: a cell can never be narrower than its share of the row at the
    // most columns, so the grid never fits more than that many.
    '--ui-card-grid-share': `calc((100% - ${maxColumns - 1} * ${gap}px) / ${maxColumns})`,
    // The insets are inside the scroller: the first row starts below the bar,
    // and a card the keyboard focus brings into view stops clear of it.
    paddingTop: top,
    paddingBottom: bottom,
    scrollPaddingTop: top,
    scrollPaddingBottom: bottom,
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  return (
    <div ref={scroller} className="ui-card-grid" style={vars} data-testid={testID}>
      {header}
      {showsEmpty({data, empty}) ? empty : (
        <div className="ui-card-grid__window">
          <div ref={start} className="ui-card-grid__spacer" style={{height: range.before}}/>
          <div
            className="ui-card-grid__cells"
            role="list"
            style={columns == null ? undefined : {gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`}}>
            {rows.slice(range.first, range.end).flatMap((row, offset) => {
              const rowIndex = range.first + offset;
              return row.map((item, column) => {
                const index = rowIndex * cut + column;
                return (
                  <div
                    key={keyExtractor ? keyExtractor(item, index) : String(index)}
                    // The cells stretch to their row, so the first one's height is the row's.
                    ref={column === 0 ? measure : undefined}
                    data-window-key={column === 0 ? keys[rowIndex] : undefined}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={data.length}
                    className="ui-card-grid__cell">
                    {renderItem(item, index)}
                  </div>
                );
              });
            })}
          </div>
          <div className="ui-card-grid__spacer" style={{height: range.after}}/>
        </div>
      )}
      {footer}
    </div>
  );
}

export type {CardGridProps} from './types';

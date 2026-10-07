import './card-grid.css';
import type {CSSProperties} from 'react';
import type {CardGridProps} from './types';
import {useEffect, useRef} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {flatten} from '../theme';
import {ESTIMATED_CELL, GAP, MAX_COLUMNS, MIN_ITEM_WIDTH} from './shared';

/**
 * Web renders a CSS grid: as many columns of at least `minItemWidth` as the
 * width holds (`repeat(auto-fill, minmax(...))`), capped at `maxColumns`
 * through the cell's own minimum, and each cell laid out as it comes into
 * view (`content-visibility: auto`), which is the browser's own lazy grid.
 * The end is watched with an `IntersectionObserver` on the last cell, for a
 * grid that loads more.
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
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = end.current;
    if (!onEndReached || !target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) onEndReached();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [onEndReached, data.length]);
  const vars = {
    '--ui-card-grid-min': `${minItemWidth}px`,
    '--ui-card-grid-gap': `${gap}px`,
    '--ui-card-grid-cell': `${estimatedItemHeight}px`,
    // The cap: a cell can never be narrower than its share of the row at the
    // most columns, so the grid never fits more than that many.
    '--ui-card-grid-share': `calc((100% - ${maxColumns - 1} * ${gap}px) / ${maxColumns})`,
    paddingTop: insets.top || undefined,
    paddingBottom: insets.bottom || undefined,
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  return (
    <div className="ui-card-grid" style={vars} data-testid={testID}>
      {header}
      {data.length === 0 && empty ? empty : (
        <div className="ui-card-grid__cells" role="list">
          {data.map((item, index) => (
            <div
              key={keyExtractor ? keyExtractor(item, index) : String(index)}
              role="listitem"
              className="ui-card-grid__cell"
              ref={index === data.length - 1 ? end : undefined}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
      {footer}
    </div>
  );
}

export type {CardGridProps} from './types';

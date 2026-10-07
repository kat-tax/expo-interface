import './list.css';
import type {CSSProperties} from 'react';
import type {ListProps} from './types';
import {useEffect, useRef} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {flatten} from '../theme';
import {ESTIMATED_ROW, keyOf} from './shared';

/**
 * Web renders a DOM list: `role="list"` over one `listitem` per row, each
 * with `content-visibility: auto`, so the browser lays a row out only as it
 * comes into view and keeps the rest at their estimated height, which is
 * the platform's own lazy list. A hairline between the rows comes from the
 * stylesheet. The end is watched with an `IntersectionObserver` on the last
 * row, for a list that loads more.
 */
export function List<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, estimatedItemHeight = ESTIMATED_ROW, contentInset, testID, style}: ListProps<T>) {
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
    '--ui-list-row': `${estimatedItemHeight}px`,
    paddingTop: insets.top || undefined,
    paddingBottom: insets.bottom || undefined,
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  return (
    <div className={['ui-list', separators && 'ui-list--separated'].filter(Boolean).join(' ')} style={vars} data-testid={testID}>
      {header}
      {data.length === 0 && empty ? empty : (
        <div role="list" className="ui-list__rows">
          {data.map((item, index) => (
            <div key={keyOf({keyExtractor}, item, index)} role="listitem" className="ui-list__row" ref={index === data.length - 1 ? end : undefined}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
      {footer}
    </div>
  );
}

export type {ListProps} from './types';

import './list.css';
import type {CSSProperties} from 'react';
import type {ListProps} from './types';
import {useEffect, useEffectEvent, useRef} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {useScrollInsets} from '../screen/insets';
import {flatten} from '../theme';
import {ESTIMATED_ROW, keyOf, showsEmpty} from './shared';
import {useWindowed} from './windowed';

/**
 * Web renders a DOM list that scrolls itself and draws only the rows near
 * the view: `role="list"` over one `listitem` per drawn row, each saying
 * where it stands in the whole (`aria-posinset`, `aria-setsize`), with two
 * spacers around the list keeping the room of the rest at their measured
 * heights once seen and at `estimatedItemHeight` before. A hairline between
 * the rows comes from the stylesheet. The list fills the room its parent
 * gives it, with the screen's insets as padding inside. The end is reached
 * once the list is laid out and its window draws the last row, for a list
 * that loads more, and again when more rows arrive while it is still drawn;
 * a hidden list reaches none.
 */
export function List<T>({data, renderItem, keyExtractor, separators = true, header, footer, empty, onEndReached, estimatedItemHeight = ESTIMATED_ROW, contentInset, testID, style}: ListProps<T>) {
  const insets = useScrollInsets(contentInset);
  const scroller = useRef<HTMLDivElement>(null);
  const keys = data.map((item, index) => keyOf({keyExtractor}, item, index));
  const {range, measured, start, measure} = useWindowed(scroller, {keys, estimate: estimatedItemHeight, gap: 0});
  const reachEnd = useEffectEvent(() => onEndReached?.());
  // Only from the list as laid out: the first rows drawn before then are not the view.
  const atEnd = measured && data.length > 0 && range.end === data.length;
  useEffect(() => {
    if (atEnd) reachEnd();
  }, [atEnd, data.length]);
  const top = insets.top || undefined;
  const bottom = insets.bottom || undefined;
  const vars = {
    // The insets are inside the scroller: the first row starts below the bar,
    // and a row the keyboard focus brings into view stops clear of it.
    paddingTop: top,
    paddingBottom: bottom,
    scrollPaddingTop: top,
    scrollPaddingBottom: bottom,
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  return (
    <div ref={scroller} className={['ui-list', separators && 'ui-list--separated'].filter(Boolean).join(' ')} style={vars} data-testid={testID}>
      {header}
      {showsEmpty({data, empty}) ? empty : (
        <>
          <div ref={start} className="ui-list__spacer" style={{height: range.before}}/>
          <div role="list" className="ui-list__rows">
            {data.slice(range.first, range.end).map((item, offset) => {
              const index = range.first + offset;
              return (
                <div
                  key={keys[index]}
                  ref={measure}
                  role="listitem"
                  aria-posinset={index + 1}
                  aria-setsize={data.length}
                  data-window-key={keys[index]}
                  // The hairline is above every row but the first, by index,
                  // so the first row drawn keeps it as the window moves.
                  className={index > 0 ? 'ui-list__row ui-list__row--ruled' : 'ui-list__row'}>
                  {renderItem(item, index)}
                </div>
              );
            })}
          </div>
          <div className="ui-list__spacer" style={{height: range.after}}/>
        </>
      )}
      {footer}
    </div>
  );
}

export type {ListProps} from './types';

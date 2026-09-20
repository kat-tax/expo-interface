import './pager.css';
import type {CSSProperties} from 'react';
import type {PagerProps} from './types';
import {useEffect, useId, useRef} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {useRovingFocus} from '../a11y/roving';
import {flatten} from '../theme';
import {clampPage, dotLabel, pageAt, pages} from './shared';

/**
 * On web the pager is a scroll-snap container, which is the browser's own
 * paging: `scroll-snap-type: x mandatory` gives the same snap, momentum and
 * rubber-banding react-native-web would produce from `pagingEnabled`, and the
 * page width is `100%` rather than something the kit has to measure.
 *
 * What the DOM adds is the part the other platforms leave to their system:
 * the pages are a tab panel each and the dots are a tab list, so the keyboard
 * reaches them the way the APG's tabbed carousel says it should — one tab
 * stop, arrows between the dots, and the page changing as focus moves.
 *
 * Every page off screen is `inert`. A carousel that leaves its hidden pages
 * in the tab order is the defect this kit's accessibility work exists to
 * catch: the focus ring goes somewhere nobody can see, and the page under it
 * cannot be read. `inert` is also why `role="tabpanel"` is honest here —
 * exactly one panel is live at a time, which is what the role promises.
 *
 * The page is read back on `scrollend` rather than on every scroll frame,
 * for the same reason as the native scroller: an animated scroll passes over
 * the pages between, and reporting those would stop it at the first of them.
 */
export function Pager({page, onPageChange, children, indicator = true, label, testID, style}: PagerProps) {
  const items = pages(children);
  const current = clampPage(page, items.length);
  const id = useId().replaceAll(/[^A-Za-z0-9_-]/g, '_');
  const scroller = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const roving = useRovingFocus(tabs, {
    orientation: 'horizontal',
    activeIndex: current,
    // A tab list activates as focus moves, which here means the page follows
    // the arrow keys rather than waiting for Enter.
    onMove: onPageChange,
  });
  // Scrolling is left to CSS: `scrollTo` with no behaviour takes the one the
  // stylesheet sets, which is smooth unless the reader has asked for less
  // motion.
  useEffect(() => {
    // The track is attached by the time an effect runs, on the first pass and
    // every one after it.
    const element = scroller.current!;
    element.scrollTo({left: current * element.clientWidth});
  }, [current]);
  return (
    <div className="ui-pager" style={flatten(StyleSheet.flatten(style) as TextStyle) as CSSProperties} data-testid={testID}>
      <div
        ref={scroller}
        className="ui-pager__pages"
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        // A scrollable region has to be reachable from the keyboard, or the
        // only way through the pages is a pointer. Chrome focuses a scroller
        // with no focusable content on its own; saying so covers the engines
        // that do not, and the case where a page does hold something
        // focusable. Arrow keys then scroll it, and the mandatory snap means
        // they land on a page rather than between two.
        tabIndex={0}
        onScrollEnd={event => {
          const next = pageAt(event.currentTarget.scrollLeft, event.currentTarget.clientWidth, items.length);
          if (next !== current) onPageChange(next);
        }}>
        {items.map((child, index) => (
          <div
            key={index}
            className="ui-pager__page"
            role="tabpanel"
            id={`${id}-page-${index}`}
            aria-labelledby={`${id}-dot-${index}`}
            inert={index !== current}>
            {child}
          </div>
        ))}
      </div>
      {indicator && items.length > 1 ? (
        <div
          ref={tabs}
          className="ui-pager__dots"
          role="tablist"
          aria-label={label}
          onKeyDown={roving.onKeyDown}
          data-testid={testID ? `${testID}-dots` : undefined}>
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              id={`${id}-dot-${index}`}
              className="ui-pager__dot"
              aria-controls={`${id}-page-${index}`}
              aria-selected={index === current}
              aria-label={dotLabel(index, items.length)}
              onClick={() => onPageChange(index)}
              {...roving.itemProps(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

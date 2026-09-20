import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {Children, useEffect, useRef, useState} from 'react';
import {Platform, ScrollView, StyleSheet, View} from 'react-native';

/** The pages, as an array the kit can count and size. */
export function pages(children: ReactNode): ReactNode[] {
  return Children.toArray(children);
}

/** `page`, brought inside a pager that has that many pages. */
export function clampPage(page: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(page, 0), count - 1);
}

/**
 * The page a scroller has come to rest on, from how far along it is.
 *
 * Rounded, because a paging scroller settles on whichever page it is nearest
 * and a drag released short of one still snaps there. A pager that has not
 * been measured yet is on its first page by definition.
 */
export function pageAt(offset: number, width: number, count: number): number {
  if (width <= 0) return 0;
  return clampPage(Math.round(offset / width), count);
}

/** What a dot is called, since a dot says nothing on its own. */
export function dotLabel(index: number, count: number): string {
  return `Page ${index + 1} of ${count}`;
}

export interface PageScrollerProps {
  page: number;
  onPageChange: (page: number) => void;
  children: ReactNode;
  label?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  /** Drawn under the pages: dots on iOS and Android, a `PipsPager` on Windows. */
  indicator?: ReactNode;
}

/**
 * The paging scroller iOS, Android and Windows share.
 *
 * `pagingEnabled` is the platform's own paging on each of the three, so the
 * momentum and the snap are the system's and the kit only says how wide a page
 * is. That width has to be measured: a horizontal scroller lays its children
 * out against unbounded width, so a percentage resolves to nothing and the
 * first frame is the one that finds out how much room there is.
 *
 * Windows asks for the snap a second way. React Native's `ScrollView` passes
 * `pagingEnabled` to the native view through a `Platform.select` that has an
 * `ios` and an `android` branch and no default, so on Windows the prop arrives
 * as `undefined` and the scroller does not page — nothing warns, it simply
 * scrolls freely. react-native-windows does implement paging, and
 * `snapToInterval` reaches it: that prop is passed straight through. (The same
 * shape of gap stops `Share` on Windows, where React Native's module only
 * dispatches on those two platforms.)
 */
export function PageScroller({page, onPageChange, children, label, testID, style, indicator}: PageScrollerProps) {
  const items = pages(children);
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);
  // Where the scroller is meant to be, which is not always the `page` prop: a
  // swipe reports where it landed, and stays there whether or not the prop
  // follows. Held in a ref so a scroll that changes nothing costs no render.
  const shown = useRef(page);
  useEffect(() => {
    shown.current = page;
    if (width > 0) scroller.current?.scrollTo({x: page * width, animated: true});
  }, [page, width]);
  /**
   * Only what the scroller settles on is reported, never what it passes over.
   * Animating to a page crosses the ones between it, and a pager that reported
   * those would be told to stop at the first of them — so a press on the third
   * dot would land on the second. Both events are wired because a drag
   * released without a fling ends without momentum.
   */
  const settle = (offset: number) => {
    const next = pageAt(offset, width, items.length);
    if (next === shown.current) return;
    shown.current = next;
    onPageChange(next);
  };
  return (
    <View style={[styles.pager, style]} testID={testID}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.track}
        accessibilityLabel={label}
        testID={testID ? `${testID}-pages` : undefined}
        onLayout={event => setWidth(event.nativeEvent.layout.width)}
        {...(Platform.OS === 'windows' && width > 0 ? {snapToInterval: width, snapToAlignment: 'start' as const} : null)}
        onScrollEndDrag={event => settle(event.nativeEvent.contentOffset.x)}
        onMomentumScrollEnd={event => settle(event.nativeEvent.contentOffset.x)}>
        {items.map((child, index) => (
          // Sized rather than labelled: a label here would fold the whole page
          // into one accessibility element, and the dots already say which
          // page this is.
          <View key={index} style={{width}}>{child}</View>
        ))}
      </ScrollView>
      {indicator}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * The pager fills the room it is given, so a page can be `flex: 1` and mean
   * it. Without this the whole thing collapses: a page has a width and no
   * height of its own, a horizontal scroller only stretches its pages to the
   * height it has itself, and a pager sized by its content has none — which
   * draws the indicator and nothing above it.
   */
  pager: {
    flexGrow: 1,
    flexShrink: 1,
  },
  /**
   * Grow and shrink, but not `flex: 1` — that sets the basis to zero, and in a
   * parent whose height comes from its content a zero basis is a scroller with
   * no height at all. This fills a parent that has a height of its own and
   * takes the pages' otherwise.
   */
  track: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

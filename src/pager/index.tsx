import type {PagerProps} from './types';
import {Pressable, StyleSheet, View} from 'react-native';
import {spacing, useColor} from '../theme';
import {PageScroller, clampPage, dotLabel, pages} from './shared';

const DOT = 7;

/**
 * iOS and Android page with `pagingEnabled`, which is `UIScrollView`'s own
 * paging and a snapping `ReactScrollView`, and draw the dots.
 *
 * The dots are drawn rather than native because neither platform's indicator
 * is reachable: `UIPageControl` is a UIKit view React Native does not wrap,
 * and Material's pager indicator is a Compose function `@expo/ui` does not
 * expose. They are tinted with the accent, which is what `UIPageControl` does
 * with `currentPageIndicatorTintColor` by default.
 */
export function Pager({page, onPageChange, children, indicator = true, label, testID, style}: PagerProps) {
  const items = pages(children);
  const current = clampPage(page, items.length);
  const on = useColor('tint');
  const off = useColor('tertiaryLabel');
  return (
    <PageScroller
      page={current}
      onPageChange={onPageChange}
      label={label}
      testID={testID}
      style={style}
      indicator={indicator && items.length > 1 ? (
        <View style={styles.dots} testID={testID ? `${testID}-dots` : undefined}>
          {items.map((_, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={dotLabel(index, items.length)}
              accessibilityState={{selected: index === current}}
              // A dot is smaller than anything should be to press, so the
              // padding around it is the target and the dot is only what is
              // drawn.
              style={styles.target}
              onPress={() => onPageChange(index)}>
              <View style={[styles.dot, {backgroundColor: index === current ? on : off}]}/>
            </Pressable>
          ))}
        </View>
      ) : null}>
      {children}
    </PageScroller>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: spacing.two,
  },
  target: {
    padding: spacing.two,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
});

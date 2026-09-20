import type {PagerProps} from './types';
import {StyleSheet} from 'react-native';
import XamlPipsPager from '../windows/specs/ExpoInterfacePipsPagerNativeComponent';
import {useXamlProps} from '../windows';
import {PageScroller, clampPage, pages} from './shared';

/** The room one pip takes, and one of the chevrons beside the row. */
const PIP = 20;
const CHEVRON = 24;
const PIPS_HEIGHT = 32;

/**
 * Windows pages with the same `pagingEnabled` scroller as iOS and Android —
 * react-native-windows implements `PagingEnabled`, `SnapToInterval` and the
 * snap alignment on its composition scroller, so the snap is the system's
 * here too — and puts a real WinUI 3 `PipsPager` under it.
 *
 * The indicator is the one part of a pager a XAML island can be, because it
 * has no children: everything it needs is a count, an index and an event. It
 * brings the chevrons Fluent shows while a pointer is over the pips, which is
 * how a desktop steps through pages when there is no swipe to make.
 *
 * The pips get a floor under their width. WinUI controls measure short of
 * what they draw inside an island (the same trap `SelectorBar` hit), and a
 * clipped indicator is worse than one with room to spare.
 */
export function Pager({page, onPageChange, children, indicator = true, label, testID, style}: PagerProps) {
  const items = pages(children);
  const current = clampPage(page, items.length);
  const xaml = useXamlProps();
  return (
    <PageScroller
      page={current}
      onPageChange={onPageChange}
      label={label}
      testID={testID}
      style={style}
      indicator={indicator && items.length > 1 ? (
        <XamlPipsPager
          count={items.length}
          selectedIndex={current}
          label={label}
          onSelectionChange={event => onPageChange(event.nativeEvent.index)}
          style={[styles.pips, {minWidth: items.length * PIP + CHEVRON * 2}]}
          testID={testID ? `${testID}-dots` : undefined}
          {...xaml}
        />
      ) : null}>
      {children}
    </PageScroller>
  );
}

const styles = StyleSheet.create({
  pips: {
    alignSelf: 'center',
    height: PIPS_HEIGHT,
  },
});

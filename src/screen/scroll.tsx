import type {Ref} from 'react';
import type {ScrollViewProps, ViewStyle} from 'react-native';
import {ScrollView, StyleSheet} from 'react-native';
import {useScrollInsets} from './insets';

/** Props of `ScreenScrollView`: React Native's `ScrollView`'s, and a `ref` to it. */
export interface ScreenScrollViewProps extends ScrollViewProps {
  ref?: Ref<ScrollView>;
}

/** A padding in points; a percentage or none adds nothing. */
const points = (value: ViewStyle['padding']) => (typeof value === 'number' ? value : 0);

/**
 * A vertical React Native `ScrollView` for a screen's own content (an
 * article's text, a drawn list) that pads its content by the screen's
 * insets (`useScrollInsets()`): the bar it passes under on a
 * `Screen underBar`, and the tab bar's floating action at its bottom. They
 * are added to the top and bottom padding `contentContainerStyle` gives in
 * points; an edge with no inset keeps its own padding as it is, and one
 * given as a percentage is replaced by the inset. Read under the `Screen`,
 * as every kit scroller reads them, so render it in the screen's content.
 *
 * On iOS under a header the screen runs under, UIKit insets the view by the
 * header itself (`contentInsetAdjustmentBehavior="automatic"`) and follows
 * a native search bar as it grows and collapses, and the padding is only
 * what floats under the header. The scroll indicators are inset with the
 * content unless `scrollIndicatorInsets` says otherwise, and a press on a
 * control in the view acts while the keyboard is up
 * (`keyboardShouldPersistTaps` is `handled` unless set). Windows has no
 * insets to pad by, so there it is a plain `ScrollView`.
 */
export function ScreenScrollView({
  contentContainerStyle,
  contentInsetAdjustmentBehavior,
  scrollIndicatorInsets,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: ScreenScrollViewProps) {
  const insets = useScrollInsets();
  const own = StyleSheet.flatten(contentContainerStyle) as ViewStyle | undefined;
  // Yoga lets an edge's own padding win over the vertical one, and that over
  // the overall one, whatever their order: read them the same way.
  const top = insets.top + points(own?.paddingTop ?? own?.paddingVertical ?? own?.padding);
  const bottom = insets.bottom + points(own?.paddingBottom ?? own?.paddingVertical ?? own?.padding);
  return (
    <ScrollView
      {...props}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={[
        contentContainerStyle,
        insets.top > 0 ? {paddingTop: top} : null,
        insets.bottom > 0 ? {paddingBottom: bottom} : null,
      ]}
      scrollIndicatorInsets={scrollIndicatorInsets ?? {top: insets.top, bottom: insets.bottom}}
      // iOS under a header the screen runs under: UIKit's own inset, which follows a native search bar.
      contentInsetAdjustmentBehavior={insets.automatic ? 'automatic' : contentInsetAdjustmentBehavior}
    />
  );
}

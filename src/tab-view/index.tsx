import type {TabViewProps} from './types';
import {StyleSheet, View} from 'react-native';
import {TabStrip, TabSwitcher, useResolvedLayout} from './draw';

/**
 * iOS and Android draw the strip themselves, because neither platform has a
 * control for it. SwiftUI's `TabView` and Compose's `TabRow` are both the
 * navigation kind — a fixed handful of sections, no closing, no adding — and
 * putting document tabs in one would mean a control that says the wrong thing
 * to VoiceOver and TalkBack about what the tabs are.
 *
 * What the platforms do have is the *shape*, and that is what is copied:
 * Safari and Chrome on both of them hide open pages behind a numbered button
 * that opens a grid of cards, and grow a real strip only on a tablet. So the
 * breakpoint is the design, and the drawing follows it.
 */
export function TabView({
  tabs,
  selected,
  onSelect,
  onClose,
  onAdd,
  children,
  label = 'Tabs',
  layout = 'auto',
  testID,
  style,
}: TabViewProps) {
  const {resolved, onLayout} = useResolvedLayout(layout);
  const draw = {tabs, selected, onSelect, onClose, onAdd, label, testID};
  return (
    <View style={[styles.root, style]} onLayout={onLayout} testID={testID}>
      {resolved === 'strip' ? (
        <>
          <TabStrip {...draw}/>
          <View style={styles.content}>{children}</View>
        </>
      ) : (
        <TabSwitcher {...draw}>
          <View style={styles.content}>{children}</View>
        </TabSwitcher>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
  /**
   * Grow and shrink, but not `flex: 1` — whose basis of zero collapses the
   * content to nothing in a parent that takes its own height from what is
   * inside it. The same trap the pager fell into.
   */
  content: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

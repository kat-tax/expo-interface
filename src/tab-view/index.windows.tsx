import type {TabViewProps, TabViewTab} from './types';
import {StyleSheet, View} from 'react-native';
import XamlTabView from '../windows/specs/ExpoInterfaceTabViewNativeComponent';
import {glyphOf, jsonProp, useXamlProps} from '../windows';
import {useColor} from '../theme';
import {TabSwitcher, useResolvedLayout} from './draw';

/**
 * The height WinUI gives a tab strip: `TabViewItemHeaderHeight`, plus the room
 * the control keeps above it for the drag region a window would use. The
 * island is sized to it, because the island is only the strip.
 */
const STRIP_HEIGHT = 40;

/**
 * Windows is the one platform with a control for this, and it gets it.
 *
 * WinUI 3's `TabView` is document tabs by design — closable, addable,
 * reorderable, with the strip Fluent draws everywhere from Edge to Terminal.
 * The kit takes **the strip alone**: the `TabViewItem`s carry no content, the
 * island is sized to the header height, and the selected page is drawn
 * underneath by React Native. Content inside the item would have to be XAML,
 * and the pages here are not: a React portal connects inside an island and is
 * reported to UI Automation, but react-native-windows 0.84 draws nothing in it.
 *
 * What that costs is reordering: dragging a tab would move it in the control
 * while the kit's own array stayed as it was, and the next render would put it
 * back. Until there is an `onReorder` to answer with, the control is told not
 * to offer a gesture it cannot keep — a strip that quietly undoes a drag is
 * worse than one that never started it.
 *
 * Under 640 points Windows falls back to the same drawn switcher as the other
 * three. WinUI has no control for that shape, and a strip that narrow is
 * unreadable in any case.
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
  const xaml = useXamlProps();
  const background = useColor('backgroundElement');
  const index = Math.max(0, tabs.findIndex(tab => tab.id === selected));
  return (
    <View style={[styles.root, style]} onLayout={onLayout} testID={testID}>
      {resolved === 'strip' ? (
        <>
          <XamlTabView
            items={tabItems(tabs, Boolean(onClose))}
            selectedIndex={index}
            addButton={Boolean(onAdd)}
            background={background}
            label={label}
            onSelectionChange={event => {
              const tab = tabs[event.nativeEvent.index];
              if (tab && tab.id !== selected) onSelect(tab.id);
            }}
            onTabClose={event => {
              const tab = tabs[event.nativeEvent.index];
              if (tab) onClose?.(tab.id);
            }}
            onAddTab={() => onAdd?.()}
            style={styles.strip}
            testID={testID ? `${testID}-strip` : undefined}
            {...xaml}
          />
          <View style={styles.content}>{children}</View>
        </>
      ) : (
        <TabSwitcher
          tabs={tabs}
          selected={selected}
          onSelect={onSelect}
          onClose={onClose}
          onAdd={onAdd}
          label={label}
          testID={testID}>
          <View style={styles.content}>{children}</View>
        </TabSwitcher>
      )}
    </View>
  );
}

/**
 * The tabs as the island's JSON: each one's title, its Fluent glyph where the
 * icon has one, and whether it closes. A pinned tab keeps its place in the
 * array — the index is how a selection comes back — and simply shows no cross.
 */
export function tabItems(tabs: readonly TabViewTab[], closable: boolean): string {
  return jsonProp(tabs.map(tab => ({
    title: tab.title,
    glyph: glyphOf(tab.icon) ?? null,
    closable: closable && !tab.pinned,
  })));
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
  strip: {
    height: STRIP_HEIGHT,
    alignSelf: 'stretch',
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

import type {MenuItem, MenuPoint} from '../menu/types';
import type {TabViewProps, TabViewTab} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {PopupMenu} from '../popup-menu';
import XamlTabView from '../windows/specs/ExpoInterfaceTabViewNativeComponent';
import {glyphOf, jsonProp, useXamlProps} from '../windows';
import {useColor} from '../theme';
import {TabSwitcher, useResolvedLayout} from './draw';
import {ADD_LABEL, isAlone, tabLabel} from './shared';

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
 *
 * With no children at all (see `isAlone`) the view is the strip, or the
 * switcher's bar, alone: as tall as that and no taller, for a strip in a
 * `HeaderAccessory` whose pages are the screen's content.
 */
export function TabView(props: TabViewProps) {
  const {
    tabs,
    selected,
    onSelect,
    onClose,
    onAdd,
    addLabel = ADD_LABEL,
    children,
    label = 'Tabs',
    layout = 'auto',
    fill = 'element',
    testID,
    style,
  } = props;
  const {resolved, onLayout} = useResolvedLayout(layout);
  const xaml = useXamlProps();
  // An island cannot be see-through (its root is white wherever its content
  // is transparent), so no fill of its own is the screen's background: the
  // fill of the Windows header row a strip sits in.
  const background = useColor(fill === 'none' ? 'background' : 'backgroundElement');
  const index = Math.max(0, tabs.findIndex(tab => tab.id === selected));
  // A tab's menu, open where the island said the right click or the Menu
  // key landed, in the island's coordinates, which are the root's.
  const [menu, setMenu] = useState<{items: MenuItem[]; at: MenuPoint} | null>(null);
  const alone = isAlone(props);
  const page = alone ? null : <View style={styles.content}>{children}</View>;
  return (
    <View style={[styles.root, alone && styles.alone, style]} onLayout={onLayout} testID={testID}>
      {resolved === 'strip' ? (
        <>
          <XamlTabView
            items={tabItems(tabs, Boolean(onClose))}
            labels={tabLabels(tabs)}
            selectedIndex={index}
            addButton={Boolean(onAdd)}
            addLabel={addLabel}
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
            onTabMenu={event => {
              const tab = tabs[event.nativeEvent.index];
              if (tab?.menu) setMenu({items: tab.menu, at: {x: event.nativeEvent.x, y: event.nativeEvent.y}});
            }}
            style={styles.strip}
            testID={testID ? `${testID}-strip` : undefined}
            {...xaml}
          />
          {page}
          <PopupMenu items={menu?.items ?? []} at={menu?.at ?? null} onDismiss={() => setMenu(null)} testID={testID ? `${testID}-menu` : undefined}/>
        </>
      ) : (
        <TabSwitcher
          tabs={tabs}
          selected={selected}
          onSelect={onSelect}
          onClose={onClose}
          onAdd={onAdd}
          addLabel={addLabel}
          fill={fill}
          label={label}
          testID={testID}>
          {page}
        </TabSwitcher>
      )}
    </View>
  );
}

/**
 * The tabs as the island's JSON: each one's title, its Fluent glyph where the
 * icon has one, whether it closes, how deep it is nested and whether it has a
 * menu to ask for. A pinned tab keeps its place in the array — the index is
 * how a selection comes back — and simply shows no cross. An accessory has no
 * place in a `TabViewItem`'s header, which holds text and a glyph; what it
 * means reaches Narrator through {@link tabLabels}.
 */
export function tabItems(tabs: readonly TabViewTab[], closable: boolean): string {
  return jsonProp(tabs.map(tab => ({
    title: tab.title,
    glyph: glyphOf(tab.icon) ?? null,
    closable: closable && !tab.pinned,
    depth: tab.depth ?? 0,
    menu: !!tab.menu?.length,
  })));
}

/**
 * The name UI Automation gives each tab, as the island's JSON. Kept out of
 * {@link tabItems}, whose every change rebuilds the WinUI items: a label
 * follows the accessory's state, and a change to it renames the items in
 * place instead.
 */
export function tabLabels(tabs: readonly TabViewTab[]): string {
  return jsonProp(tabs.map(tabLabel));
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
  /** The tabs alone have no page to grow for. */
  alone: {
    flexGrow: 0,
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

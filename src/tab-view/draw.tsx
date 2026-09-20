import type {LayoutChangeEvent} from 'react-native';
import type {ReactNode} from 'react';
import type {IconToken} from '../icons';
import type {ResolvedLayout} from './shared';
import type {TabViewLayout, TabViewTab} from './types';
import {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View, useWindowDimensions} from 'react-native';
import {Glyph} from './glyph';
import {Body, Caption} from '../typography';
import {spacing, useColor} from '../theme';
import {ADD_LABEL, closeLabel, resolveLayout, switcherLabel, tabIndex} from './shared';

/** The cross on a tab, the plus at the end of the strip, and the switcher's own glyph. */
const CLOSE: IconToken = {symbol: {ios: 'xmark', android: 'close', web: 'close'}};
const ADD: IconToken = {symbol: {ios: 'plus', android: 'add', web: 'add'}};
const GRID: IconToken = {symbol: {ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view'}};

/** Glyph sizes: a tab's own icon beside its text, and the cross, which sits inside it. */
const ICON = 16;
const CROSS = 14;

/**
 * The shape the tabs come out as, and the measurement that decides it.
 *
 * Measured rather than taken from the window, for the reason `Tabs` measures
 * its pane: a navigation pane beside the tabs changes the room a strip has
 * without the window changing size at all. The window's width stands in for
 * the first frame, before a layout has happened — and on Windows it is the
 * only number that arrives at all until one does, since react-native-windows
 * reports no dimension change when a window is resized.
 */
export function useResolvedLayout(layout: TabViewLayout): {
  resolved: ResolvedLayout;
  onLayout: (event: LayoutChangeEvent) => void;
} {
  const {width: windowWidth} = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  return {
    resolved: resolveLayout(layout, measured ?? windowWidth),
    onLayout: (event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width),
  };
}

/** A child's `testID` under its parent's, or nothing where the parent has none. */
export function sub(testID: string | undefined, suffix: string): string | undefined {
  return testID ? `${testID}-${suffix}` : undefined;
}

export interface TabDrawProps {
  tabs: readonly TabViewTab[];
  selected: string;
  onSelect: (id: string) => void;
  onClose?: (id: string) => void;
  onAdd?: () => void;
  label: string;
  testID?: string;
}

/**
 * The strip iOS and Android draw: a scrolling row of tabs, each with its close
 * cross, and the add button at the end.
 *
 * The cross is a control beside the tab rather than inside it. Nesting one
 * pressable in another makes a tab whose cross is also a press of the tab, and
 * hands a screen reader a button inside a tab that it cannot reach on its own;
 * two controls in a row is what the platforms draw and what they announce.
 */
export function TabStrip({tabs, selected, onSelect, onClose, onAdd, label, testID}: TabDrawProps) {
  const surface = useColor('backgroundElement');
  const open = useColor('background');
  const labelColor = useColor('label');
  const secondary = useColor('secondaryLabel');
  return (
    <View style={[styles.strip, {backgroundColor: surface}]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        contentContainerStyle={styles.stripRow}
        testID={sub(testID, 'strip')}>
        {tabs.map(tab => {
          const on = tab.id === selected;
          return (
            <View key={tab.id} style={[styles.tab, on && {backgroundColor: open}]}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{selected: on}}
                onPress={() => onSelect(tab.id)}
                style={styles.tabBody}
                testID={sub(testID, `tab-${tab.id}`)}>
                {tab.icon ? <Glyph icon={tab.icon} size={ICON} tintColor={on ? labelColor : secondary}/> : null}
                <Body numberOfLines={1} color={on ? 'label' : 'secondaryLabel'} style={styles.title}>
                  {tab.title}
                </Body>
              </Pressable>
              {onClose && !tab.pinned ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={closeLabel(tab)}
                  onPress={() => onClose(tab.id)}
                  style={styles.cross}
                  testID={sub(testID, `close-${tab.id}`)}>
                  <Glyph icon={CLOSE} size={CROSS} tintColor={secondary}/>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ADD_LABEL}
          onPress={onAdd}
          style={styles.add}
          testID={sub(testID, 'add')}>
          <Glyph icon={ADD} size={ICON} tintColor={labelColor}/>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * The switcher every platform falls back to under 640 points: a bar naming the
 * open tab with the count beside it, which opens a grid of cards over the
 * content — Safari's and Chrome's shape on a phone, on iOS and Android alike.
 *
 * The grid replaces the content rather than floating over it, which is both
 * what those browsers do and what keeps the whole thing one flow: nothing is
 * absolutely positioned, so a grid taller than the screen scrolls.
 */
export function TabSwitcher({
  tabs,
  selected,
  onSelect,
  onClose,
  onAdd,
  label,
  testID,
  children,
}: TabDrawProps & {children?: ReactNode}) {
  const [open, setOpen] = useState(false);
  const surface = useColor('backgroundElement');
  const card = useColor('background');
  const labelColor = useColor('label');
  const secondary = useColor('secondaryLabel');
  const current = tabs[tabIndex(tabs, selected)];
  return (
    <>
      <View style={[styles.bar, {backgroundColor: surface}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={switcherLabel(tabs, selected)}
          accessibilityState={{expanded: open}}
          onPress={() => setOpen(!open)}
          style={styles.barBody}
          testID={sub(testID, 'switcher')}>
          <Glyph icon={GRID} size={ICON} tintColor={labelColor}/>
          <Body numberOfLines={1} style={styles.title}>{current ? current.title : label}</Body>
          <View style={[styles.count, {borderColor: secondary}]}>
            <Caption color="secondaryLabel">{tabs.length}</Caption>
          </View>
        </Pressable>
        {onAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ADD_LABEL}
            onPress={() => {
              setOpen(false);
              onAdd();
            }}
            style={styles.add}
            testID={sub(testID, 'add')}>
            <Glyph icon={ADD} size={ICON} tintColor={labelColor}/>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <ScrollView
          accessibilityRole="tablist"
          accessibilityLabel={label}
          contentContainerStyle={styles.grid}
          testID={sub(testID, 'cards')}>
          {tabs.map(tab => {
            const on = tab.id === selected;
            return (
              <View key={tab.id} style={[styles.card, {backgroundColor: card}, on && {borderColor: labelColor}]}>
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{selected: on}}
                  onPress={() => {
                    setOpen(false);
                    onSelect(tab.id);
                  }}
                  style={styles.cardBody}
                  testID={sub(testID, `card-${tab.id}`)}>
                  {tab.icon ? <Glyph icon={tab.icon} size={ICON} tintColor={secondary}/> : null}
                  <Body numberOfLines={2}>{tab.title}</Body>
                </Pressable>
                {onClose && !tab.pinned ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={closeLabel(tab)}
                    onPress={() => onClose(tab.id)}
                    style={styles.cardCross}
                    testID={sub(testID, `close-${tab.id}`)}>
                    <Glyph icon={CLOSE} size={CROSS} tintColor={secondary}/>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        children
      )}
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stripRow: {
    alignItems: 'stretch',
  },
  /**
   * The open tab is the page's own colour and the strip behind it is not,
   * which is how every browser says which tab the content below belongs to.
   */
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
    paddingLeft: spacing.three,
    paddingRight: spacing.one,
  },
  tabBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    flexShrink: 1,
    paddingVertical: spacing.three,
  },
  title: {
    flexShrink: 1,
  },
  cross: {
    padding: spacing.one,
    marginLeft: spacing.one,
  },
  add: {
    justifyContent: 'center',
    paddingHorizontal: spacing.three,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    flexGrow: 1,
    flexShrink: 1,
    paddingVertical: spacing.three,
    paddingHorizontal: spacing.three,
  },
  /** The count is a bare numeral, so it is boxed to read as one rather than as more title. */
  count: {
    minWidth: 22,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    paddingHorizontal: spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.three,
    padding: spacing.three,
  },
  card: {
    flexGrow: 1,
    flexBasis: '40%',
    // Room for a file name beside its icon and its cross: two columns on a
    // phone, and none of them breaking a name mid-word.
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
  },
  cardBody: {
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.two,
    padding: spacing.three,
  },
  cardCross: {
    padding: spacing.three,
  },
});

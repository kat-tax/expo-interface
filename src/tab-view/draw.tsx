import type {LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import type {ReactNode, RefObject} from 'react';
import type {IconToken} from '../icons';
import type {MenuItem, MenuPoint} from '../menu/types';
import type {ResolvedLayout, TabViewSize} from './shared';
import type {TabViewFill, TabViewLayout, TabViewTab} from './types';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions} from 'react-native';
import {inSet} from '../a11y/set';
import {androidContentPadding} from '../button/shared';
import {PopupMenu} from '../popup-menu';
import {Icon as Glyph} from '../symbol';
import {Body, Caption, Footnote} from '../typography';
import {spacing, useColor} from '../theme';
import {GLYPHS, closeLabel, resolveLayout, revealOffset, switcherLabel, tabIndex, tabLabel} from './shared';

/** The cross on a tab, the plus at the end of the strip, and the switcher's own glyph. */
const CLOSE: IconToken = {symbol: {ios: 'xmark', android: 'close', web: 'close'}};
const ADD: IconToken = {symbol: {ios: 'plus', android: 'add', web: 'add'}};
const GRID: IconToken = {symbol: {ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view'}};

/**
 * The text of a tab and of the switcher's bar at each size: the body, or
 * the footnote, which is the small button's 13 on 18 on iOS and Android.
 */
const TEXT = {regular: Body, small: Footnote} as const;

/** How far each level of `depth` moves a tab in. */
export const DEPTH_INDENT = 12;

/** The add button's padding a side: the small circle button's square at the small size. */
const ADD_PAD = {regular: spacing.three, small: 7} as const;

/**
 * What the accent's tabs take of the kit's buttons, as the platform draws
 * them: on Android Material's, at its content padding a side (the small
 * button's for `small`, the medium's otherwise), at least its 40 tall, in
 * its label's medium weight; on iOS the drawn button's 12 a side (18 at the
 * regular size), semibold. Every tab takes the open one's padding, so a
 * change of tab moves none of them.
 */
export function accentTab(size: TabViewSize): {paddingHorizontal: number; minHeight?: number; fontWeight: '500' | '600'} {
  if (Platform.OS === 'android') {
    return {paddingHorizontal: androidContentPadding(size === 'small' ? 'small' : 'medium').end, minHeight: 40, fontWeight: '500'};
  }
  return {paddingHorizontal: size === 'small' ? 12 : 18, fontWeight: '600'};
}

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
  /** What the add button is called. */
  addLabel: string;
  /** What the strip or the bar is painted with. */
  fill: TabViewFill;
  /** The strip's and the bar's metrics; the cards keep theirs. */
  size: TabViewSize;
  label: string;
  testID?: string;
}

/** A tab's menu, open at a point in the strip's own coordinates. */
interface OpenMenu {
  items: MenuItem[];
  at: MenuPoint;
}

/** Where a tab is in its scroller, from its layout. */
interface Place {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The axis a scroller of tabs scrolls along: the strip across, the cards down. */
type Axis = 'x' | 'y';

export interface TabPlaces {
  /** A tab's layout in the scroller. */
  onPlace: (id: string, event: LayoutChangeEvent) => void;
  /** The scroller's own frame: the room a tab has to be in view in. */
  onFrame: (event: LayoutChangeEvent) => void;
  /** The scroller's scroll, which moves the tabs under the menu's coordinates and out of view. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /**
   * Where a tab's menu opens: under the tab, in the coordinates of the box
   * around the scroller, or `null` before the tab has reported its layout.
   */
  menuPoint: (id: string) => MenuPoint | null;
}

/**
 * Where the tabs are in the strip or the grid, and what that serves: the menu
 * a long press opens under a tab, and the scroll that brings the selected tab
 * into view.
 *
 * Each tab reports its layout, and the scroller its own frame and its scroll,
 * all kept in refs since none of it draws anything. The selected tab is
 * brought wholly into view when `selected` changes and when the scroller
 * first shows it, with the platform's animation; a tab selected before it has
 * reported its layout (one added and selected at once) is brought into view
 * once it has, and a tab already in view moves nothing. `shown` false is a
 * scroller that is not drawn (the cards closed), whose places are forgotten
 * with it, so the cards open again to fresh ones. `scroller` is the caller's
 * ref to the scroller, which the reveal scrolls.
 */
export function useTabPlaces(selected: string, axis: Axis, shown: boolean, scroller: RefObject<ScrollView | null>): TabPlaces {
  const places = useRef(new Map<string, Place>());
  const offset = useRef(0);
  const extent = useRef(0);
  const pending = useRef<string | null>(null);

  const reveal = useCallback(() => {
    const id = pending.current;
    if (id === null) return;
    const place = places.current.get(id);
    if (!place || !extent.current) return;
    pending.current = null;
    const target = axis === 'x'
      ? revealOffset(place.x, place.width, offset.current, extent.current)
      : revealOffset(place.y, place.height, offset.current, extent.current);
    if (target === null) return;
    scroller.current!.scrollTo(axis === 'x' ? {x: target, animated: true} : {y: target, animated: true});
  }, [axis, scroller]);

  useEffect(() => {
    if (!shown) {
      places.current.clear();
      offset.current = 0;
      extent.current = 0;
      pending.current = null;
      return;
    }
    pending.current = selected;
    reveal();
  }, [selected, shown, reveal]);

  return {
    onPlace: (id, event) => {
      places.current.set(id, event.nativeEvent.layout);
      if (pending.current === id) reveal();
    },
    onFrame: event => {
      const {width, height} = event.nativeEvent.layout;
      extent.current = axis === 'x' ? width : height;
      reveal();
    },
    onScroll: event => {
      offset.current = event.nativeEvent.contentOffset[axis];
    },
    menuPoint: id => {
      const place = places.current.get(id);
      if (!place) return null;
      return axis === 'x'
        ? {x: place.x - offset.current, y: place.y + place.height}
        : {x: place.x, y: place.y + place.height - offset.current};
    },
  };
}

/**
 * The menus of the tabs that have one, as one `PopupMenu` over the strip or
 * the cards: a long press on a tab opens its menu under the tab, from the
 * tab's place less the scroll, so one native menu serves every tab rather
 * than one per tab.
 */
export function useTabMenus(testID: string | undefined, places: TabPlaces): {
  menu: ReactNode;
  open: (tab: TabViewTab) => void;
} {
  const [open, setOpen] = useState<OpenMenu | null>(null);
  return {
    open: tab => {
      const at = places.menuPoint(tab.id);
      if (!tab.menu || !at) return;
      setOpen({items: tab.menu, at});
    },
    menu: <PopupMenu items={open?.items ?? []} at={open?.at ?? null} onDismiss={() => setOpen(null)} testID={sub(testID, 'menu')}/>,
  };
}

/**
 * The strip iOS and Android draw: a scrolling row of tabs, each with its close
 * cross, and the add button after the last tab, which stays at the strip's
 * end once the tabs fill it.
 *
 * The cross is a control beside the tab rather than inside it. Nesting one
 * pressable in another makes a tab whose cross is also a press of the tab, and
 * hands a screen reader a button inside a tab that it cannot reach on its own;
 * two controls in a row is what the platforms draw and what they announce.
 *
 * The accessory is hidden from assistive technology, in the strip and on the
 * cards: the tab is one stop that names itself from `label`, and on Android
 * an accessible view inside it (a `Badge`) would be a stop of its own.
 */
export function TabStrip({tabs, selected, onSelect, onClose, onAdd, addLabel, fill, size, label, testID}: TabDrawProps) {
  // With no fill of its own the strip is on a material or a header's fill,
  // where the page's colour no longer marks the open tab; the translucent
  // pill fill reads on either. The accent marks it with a capsule in the
  // tint instead, for a strip on a page, where that pill reads faint.
  const filled = fill === 'element';
  const accent = fill === 'accent';
  const surface = useColor('backgroundElement');
  const open = useColor(filled ? 'background' : accent ? 'tint' : 'pillBackground');
  const onTint = useColor('onTint');
  const labelColor = useColor('label');
  const secondary = useColor('secondaryLabel');
  const small = size === 'small';
  const glyphs = GLYPHS[size];
  const TabText = TEXT[size];
  // The accent's tabs are the kit's buttons: the open one filled, the others
  // text buttons in the label tone, in a row 8 apart that keeps the screen's
  // margin at its ends, as a row of buttons on a page does.
  const button = accent ? accentTab(size) : null;
  const scroller = useRef<ScrollView>(null);
  const places = useTabPlaces(selected, 'x', true, scroller);
  const menus = useTabMenus(testID, places);
  return (
    <View style={[styles.strip, filled && {backgroundColor: surface}]}>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        style={styles.scroller}
        contentContainerStyle={[styles.stripRow, accent && styles.accentRow]}
        onLayout={places.onFrame}
        onScroll={places.onScroll}
        scrollEventThrottle={16}
        testID={sub(testID, 'strip')}>
        {tabs.map((tab, index) => {
          const on = tab.id === selected;
          // The accent's open tab, whose text and glyphs read on the tint.
          const capsule = on && accent;
          return (
            <View
              key={tab.id}
              style={[
                styles.tab,
                button && {paddingLeft: button.paddingHorizontal, paddingRight: button.paddingHorizontal, minHeight: button.minHeight},
                on && {backgroundColor: open},
                on && fill === 'none' && styles.pill,
                capsule && styles.capsule,
                // The accent's tab is a button, whose padding is its own: a
                // step in a level stands before it rather than inside it.
                tab.depth ? (accent ? {marginLeft: tab.depth * DEPTH_INDENT} : {paddingLeft: spacing.three + tab.depth * DEPTH_INDENT}) : null,
              ]}
              onLayout={event => places.onPlace(tab.id, event)}>
              <Pressable
                accessibilityRole="tab"
                // Named explicitly rather than left to the text inside it:
                // react-native-windows composes no name from a view's
                // children, so on Windows the tab announced its position and
                // nothing else — "1 of 3, tab". Only the automation tree
                // showed it. The label, where given, says what the
                // accessory shows.
                accessibilityLabel={tabLabel(tab)}
                accessibilityState={{selected: on}}
                onPress={() => onSelect(tab.id)}
                onLongPress={tab.menu ? () => menus.open(tab) : undefined}
                style={[styles.tabBody, small && styles.small]}
                testID={sub(testID, `tab-${tab.id}`)}
                {...inSet(index + 1, tabs.length)}>
                {tab.icon ? <Glyph icon={tab.icon} size={glyphs.icon} tintColor={capsule ? onTint : on || accent ? labelColor : secondary}/> : null}
                <TabText numberOfLines={1} color={capsule ? 'onTint' : on || accent ? 'label' : 'secondaryLabel'} style={[styles.title, button && {fontWeight: button.fontWeight}]}>
                  {tab.title}
                </TabText>
                {tab.accessory ? <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.accessory}>{tab.accessory}</View> : null}
              </Pressable>
              {onClose && !tab.pinned ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={closeLabel(tab)}
                  onPress={() => onClose(tab.id)}
                  style={styles.cross}
                  testID={sub(testID, `close-${tab.id}`)}>
                  <Glyph icon={CLOSE} size={glyphs.cross} tintColor={capsule ? onTint : accent ? labelColor : secondary}/>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          onPress={onAdd}
          // The accent's row keeps the screen's 16 at its end, the plus too.
          style={[styles.add, small && styles.addSmall, accent && {marginRight: spacing.three - ADD_PAD[size]}]}
          testID={sub(testID, 'add')}>
          <Glyph icon={ADD} size={glyphs.add} tintColor={labelColor}/>
        </Pressable>
      ) : null}
      {menus.menu}
    </View>
  );
}

/**
 * The most of the window's height the cards take with the tabs alone, where
 * nothing under them bounds the grid: past it, they scroll.
 */
export const ALONE_CARDS = 0.5;

/**
 * The switcher every platform falls back to under 640 points: a bar naming the
 * open tab with the count beside it, which opens a grid of cards over the
 * content — Safari's and Chrome's shape on a phone, on iOS and Android alike.
 *
 * The grid replaces the content rather than floating over it, which is both
 * what those browsers do and what keeps the whole thing one flow: nothing is
 * absolutely positioned, so a grid taller than the view scrolls in it.
 *
 * With the tabs `alone` there is no content to replace: the grid opens under
 * the bar and makes the view taller, as far as {@link ALONE_CARDS} of the
 * window, and scrolls past that. In a `HeaderAccessory` that is the header's
 * row growing, which pushes the screen's content down, or lies over it where
 * the row floats under a header the screens run under; nothing under the row
 * would stop a long grid at the screen's edge.
 */
export function TabSwitcher({
  tabs,
  selected,
  onSelect,
  onClose,
  onAdd,
  addLabel,
  fill,
  size,
  label,
  testID,
  alone,
  children,
}: TabDrawProps & {
  /** The tabs alone, with no content for the cards to take the place of. */
  alone: boolean;
  children?: ReactNode;
}) {
  const {height: windowHeight} = useWindowDimensions();
  const [open, setOpen] = useState(false);
  // The bar names the open tab rather than drawing it, so the accent's
  // capsule has nothing to mark here, and the bar is bare as with `none`.
  const filled = fill === 'element';
  const small = size === 'small';
  const TabText = TEXT[size];
  const surface = useColor('backgroundElement');
  const card = useColor('background');
  const labelColor = useColor('label');
  const secondary = useColor('secondaryLabel');
  const current = tabs[tabIndex(tabs, selected)];
  const scroller = useRef<ScrollView>(null);
  const places = useTabPlaces(selected, 'y', open, scroller);
  const menus = useTabMenus(testID, places);
  return (
    <>
      <View style={[styles.bar, filled && {backgroundColor: surface}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={switcherLabel(tabs, selected)}
          accessibilityState={{expanded: open}}
          onPress={() => setOpen(!open)}
          style={[styles.barBody, small && styles.small]}
          testID={sub(testID, 'switcher')}>
          <Glyph icon={GRID} size={GLYPHS[size].icon} tintColor={labelColor}/>
          <TabText numberOfLines={1} style={styles.title}>{current ? current.title : label}</TabText>
          <View style={[styles.count, small && styles.countSmall, {borderColor: secondary}]}>
            <Caption color="secondaryLabel">{tabs.length}</Caption>
          </View>
        </Pressable>
        {onAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={addLabel}
            onPress={() => {
              setOpen(false);
              onAdd();
            }}
            style={[styles.add, small && styles.addSmall]}
            testID={sub(testID, 'add')}>
            <Glyph icon={ADD} size={GLYPHS[size].add} tintColor={labelColor}/>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View style={styles.cardsRoot}>
          <ScrollView
            ref={scroller}
            accessibilityRole="tablist"
            accessibilityLabel={label}
            style={alone ? {maxHeight: windowHeight * ALONE_CARDS} : undefined}
            contentContainerStyle={styles.grid}
            onLayout={places.onFrame}
            onScroll={places.onScroll}
            scrollEventThrottle={16}
            testID={sub(testID, 'cards')}>
            {tabs.map((tab, index) => {
              const on = tab.id === selected;
              return (
                <View
                  key={tab.id}
                  style={[styles.card, {backgroundColor: card}, on && {borderColor: labelColor}]}
                  onLayout={event => places.onPlace(tab.id, event)}>
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityLabel={tabLabel(tab)}
                    accessibilityState={{selected: on}}
                    onPress={() => {
                      setOpen(false);
                      onSelect(tab.id);
                    }}
                    onLongPress={tab.menu ? () => menus.open(tab) : undefined}
                    style={[styles.cardBody, tab.depth ? {paddingLeft: spacing.three + tab.depth * DEPTH_INDENT} : null]}
                    testID={sub(testID, `card-${tab.id}`)}
                    {...inSet(index + 1, tabs.length)}>
                    {tab.icon ? <Glyph icon={tab.icon} size={GLYPHS.regular.icon} tintColor={secondary}/> : null}
                    <Body numberOfLines={2}>{tab.title}</Body>
                    {tab.accessory ? <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.accessory}>{tab.accessory}</View> : null}
                  </Pressable>
                  {onClose && !tab.pinned ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={closeLabel(tab)}
                      onPress={() => onClose(tab.id)}
                      style={styles.cardCross}
                      testID={sub(testID, `close-${tab.id}`)}>
                      <Glyph icon={CLOSE} size={GLYPHS.regular.cross} tintColor={secondary}/>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
          {menus.menu}
        </View>
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
  /**
   * The tabs' width and no more, where a `ScrollView` grows by default: the
   * add button after it then follows the last tab, and once the tabs fill
   * the row the scroller shrinks to the room the button leaves and scrolls.
   */
  scroller: {
    flexGrow: 0,
    flexShrink: 1,
  },
  stripRow: {
    alignItems: 'stretch',
  },
  /** The accent's row of buttons: 8 apart, the screen's 16 at its ends, 8 above and below. */
  accentRow: {
    alignItems: 'center',
    gap: spacing.two,
    paddingHorizontal: spacing.three,
    paddingVertical: spacing.two,
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
  /** The open tab on a strip with no fill of its own, where a pill marks it. */
  pill: {
    borderRadius: 8,
  },
  /** The accent's open tab: a capsule, as the kit's filled button. */
  capsule: {
    borderRadius: 999,
  },
  tabBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    flexShrink: 1,
    paddingVertical: spacing.three,
  },
  /**
   * The small size's tab and bar: the small button's 6 above and below the
   * footnote's 18 point line, 30 tall.
   */
  small: {
    paddingVertical: 6,
  },
  title: {
    flexShrink: 1,
  },
  /**
   * The accessory, hidden from assistive technology, at its own size: a
   * card's column would stretch it across the card.
   */
  accessory: {
    alignItems: 'flex-start',
  },
  cross: {
    padding: spacing.one,
    marginLeft: spacing.one,
  },
  add: {
    justifyContent: 'center',
    paddingHorizontal: ADD_PAD.regular,
  },
  /** The plus in a square as tall as the small strip, as in the small circle button. */
  addSmall: {
    paddingHorizontal: ADD_PAD.small,
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
  countSmall: {
    minWidth: 20,
  },
  /** The cards and the menu over them: the menu is placed against this box. */
  cardsRoot: {
    flexGrow: 1,
    flexShrink: 1,
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

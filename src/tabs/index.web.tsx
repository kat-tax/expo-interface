import type {TabTriggerSlotProps, TabListProps} from 'expo-router/ui';
import type {ReactNode} from 'react';
import type {SheetMaterial} from '../sheet/types';
import type {HeaderSlot} from './context';
import type {TabBarProps, TabRoute, WebLogo} from './types';

import {Tabs as WebTabs, TabSlot, TabList, TabTrigger} from 'expo-router/ui';
import {View, Pressable, StyleSheet} from 'react-native';
import {useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {SymbolView} from 'expo-symbols';
import {Image} from 'expo-image';
import app from 'expo-constants';

import {theme, spacing, bound} from '../theme';
import {useSearchSite} from '../header-search/site';
import {materialProps} from '../material';
import {hasMaterial} from '../sheet/shared';
import {Icon} from '../symbol';
import {BarRowsContext, HeaderSlotContext, InBarContext, NarrowBarContext, TabBarContext, createHeaderSlot, noSubscription, useNarrowBar} from './context';
import {routeToken} from './icon';
import {Headline, Label} from '../typography';

/**
 * The height of the search row a folded header puts under the bar: the field
 * with the bar's padding around it, and the gap to the bar. What the screens
 * pay on top of the bar's inset while the row is there.
 */
export const FOLDED_SEARCH_INSET = 56;

export function Tabs({
  routes,
  hidden = false,
  webLogo = 'icon-and-text',
  webIcon,
  webActions,
  webActionsPlacement = 'before',
  webFoldHeader = true,
  webMaterial = 'none',
}: TabBarProps) {
  // One slot per bar, built once: the headers below publish into it.
  const [store] = useState(createHeaderSlot);
  const slot = webFoldHeader ? store : null;
  // Only whether a pushed screen's header is folded in, not which: the bar
  // reads that itself, so a screen's own re-render never re-renders the
  // screens. The same reader answers a static render, where no header has
  // published — publishing is an effect, and effects do not run there.
  // A tab's own screen folds in a trailing slot at most, which is no reason to
  // keep a hidden bar: without a back button in it there would be no way out.
  const isFolded = () => slot?.get()?.title != null;
  const folded = useSyncExternalStore(slot ? slot.subscribe : noSubscription, isFolded, isFolded);
  // The bar stays while it carries a screen's header, even with the tabs hidden.
  const shown = !hidden || folded;
  // The rows the bar has put under itself for a folded header (its `stacked`
  // search, its accessory), which the screens pay for.
  const [rows, setRows] = useState(0);
  return (
    <HeaderSlotContext.Provider value={slot}>
      {/* The bar floats over the screens; what is under it leaves its space clear. */}
      <TabBarContext.Provider value={shown}>
        <BarRowsContext.Provider value={rows}>
          <WebTabs>
            <TabSlot style={styles.slot}/>
            {/* The triggers stay in the list even while the bar is hidden: that is where the router looks for the routes. */}
            <TabList asChild>
              <WebTabList logo={webLogo} icon={webIcon} slot={slot} hidden={hidden} shown={shown} actions={webActions} actionsPlacement={webActionsPlacement} material={webMaterial} onRows={setRows}>
                {routes.map(route => (
                  <TabTrigger key={route.name} name={route.name} href={route.href} asChild>
                    <TabLink icon={route.icon} badge={route.badge}>{route.label}</TabLink>
                  </TabTrigger>
                ))}
              </WebTabList>
            </TabList>
          </WebTabs>
        </BarRowsContext.Provider>
      </TabBarContext.Provider>
    </HeaderSlotContext.Provider>
  );
}

interface WebTabListProps extends TabListProps {
  logo: WebLogo;
  icon?: TabBarProps['webIcon'];
  /** The slot a screen's header publishes into, when the bar takes one. */
  slot?: HeaderSlot | null;
  /** The tabs are hidden (`Tabs hidden`). */
  hidden?: boolean;
  /** The bar itself is drawn: it is not hidden, or it carries a header. */
  shown?: boolean;
  actions?: ReactNode;
  actionsPlacement?: 'before' | 'after';
  /** The bar's material (`Tabs webMaterial`): a blur of what passes under it, or its solid fill. */
  material?: SheetMaterial;
  /**
   * Told the height of the rows the bar draws under itself for a folded
   * header, its stacked search and its accessory, with the gaps to the bar.
   */
  onRows?: (height: number) => void;
}

export function WebTabList({logo, icon, slot, hidden = false, shown = true, actions, actionsPlacement = 'before', material = 'none', onRows, ...props}: WebTabListProps) {
  // As in `Tabs`: one reader for the live bar and for a static render, which
  // has no published header either way.
  const read = () => (slot ? slot.get() : null);
  const header = useSyncExternalStore(slot ? slot.subscribe : noSubscription, read, read);
  const isPreset = typeof logo === 'string';
  const isTextOnly = logo === 'text-only';
  const isIconOnly = logo === 'icon-only';
  // A pushed screen owns both ends of the bar: its back button in the mark's
  // place and its title where the app's name goes, and its trailing content
  // where the bar's own actions would be. A tab's own screen folds in the
  // trailing content alone and leaves the logo slot to `webLogo`, since the
  // tab beside it is already its title.
  const title = header?.title;
  const trailing = header?.trailing ?? actions;
  // The app's mark: an image, or one of the app's own icon tokens drawn as
  // the kit's glyph in the label color, so a mark can be an icon the app
  // already names.
  const mark = isPreset
    ? !isTextOnly && icon != null && (
      typeof icon === 'object' && 'symbol' in icon
        ? <Icon icon={icon} size={24} tone="label" testID="tab-bar-mark"/>
        : <Image style={styles.icon} source={icon} contentFit="contain"/>
    )
    : title == null && logo;
  const {row, logo: logoSlot, narrow} = useFit();
  // The folded header's search. An inline field goes in the logo slot, after
  // the mark and the name or a pushed screen's title, where a site's search
  // sits; a magnifier goes among the actions; a stacked row goes under the bar.
  const search = useSearchSite(header?.search);
  const inline = search.placement === 'inline' ? search.inRow : null;
  const stackedRow = search.stacked != null;
  // The folded header's accessory: a row of its own under the bar (and under
  // the stacked search), measured, since its content sets its height.
  const accessory = header?.accessory;
  const {row: accessoryRow, height: accessoryHeight} = useRowHeight(accessory != null);
  const rows = (stackedRow ? FOLDED_SEARCH_INSET : 0) + (accessoryHeight > 0 ? accessoryHeight + spacing.two : 0);
  useEffect(() => {
    onRows?.(rows);
  }, [onRows, rows]);
  const fill = hasMaterial(material) ? null : styles.solid;
  const actionsAndSearch = (
    <>
      {trailing}
      {inline ? null : search.inRow}
    </>
  );
  return (
    <View style={[styles.block, !shown && styles.hidden]}>
      {/* A landmark, not a `tablist`. These move between routes rather than
          between panels in a page, so the honest markup is navigation — and a
          navigation's links are each their own tab stop, which means there is no
          arrow-key pattern owed here (see `src/a11y/roving.ts` for the ones that
          are). Named, because a page can hold more than one landmark and "banner"
          alone tells a screen-reader user nothing. */}
      <View {...props} role="navigation" aria-label="Main" testID="tab-bar" style={[styles.list, !shown && styles.hidden]}>
        {/* A material paints the row through the stylesheet, so the row's own fill stays off then. */}
        <View ref={row} testID="tab-bar-row" style={[styles.inner, fill]} {...materialProps(material, 'element', 'all')}>
          <View ref={logoSlot} testID="tab-bar-logo" style={styles.logo}>
            {header?.onBack ? <BackButton onPress={header.onBack}/> : mark}
            {title != null ? (
              // The pushed screen's title is the page's heading, so it is the
              // one h1 on it.
              <Headline color="label" level={1} numberOfLines={1} style={styles.title}>
                {title}
              </Headline>
            ) : isPreset && !isIconOnly && !(narrow && inline && mark) ? (
              // The app's name is not a heading: it names the whole site, and it
              // sits inside the navigation landmark rather than over any content.
              // In a bar too narrow for its labels a search beside the mark
              // takes the name's room, and the mark stands for the app alone.
              <Headline color="label" level={false}>
                {app.expoConfig?.name}
              </Headline>
            ) : null}
            {inline ? (
              <InBarContext.Provider value={true}>
                {/* The field shows its short placeholder while the bar is narrow. */}
                <NarrowBarContext.Provider value={narrow}>{inline}</NarrowBarContext.Provider>
              </InBarContext.Provider>
            ) : null}
          </View>
          <InBarContext.Provider value={true}>
            <NarrowBarContext.Provider value={narrow}>
              {actionsPlacement === 'before' ? actionsAndSearch : null}
              <View testID="tab-bar-tabs" style={[styles.tabs, hidden && styles.hidden]}>
                {props.children}
              </View>
              {actionsPlacement === 'after' ? actionsAndSearch : null}
            </NarrowBarContext.Provider>
          </InBarContext.Provider>
        </View>
      </View>
      {/* The stacked search: a second pill under the bar, in the bar's own material, at the bar's width. */}
      {stackedRow ? (
        <View testID="tab-bar-search" style={[styles.searchRow, fill]} {...materialProps(material, 'element', 'all')}>
          <InBarContext.Provider value={true}>{search.stacked}</InBarContext.Provider>
        </View>
      ) : null}
      {/* The accessory: a pill under the bar, in the bar's own material, at the bar's width. */}
      {accessory != null ? (
        <View ref={accessoryRow} testID="tab-bar-accessory" style={[styles.accessoryRow, fill]} {...materialProps(material, 'element', 'all')}>
          {accessory}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The height of a row under the bar whose content sets it, read from the
 * page after every render and on a resize; zero while the row is not drawn.
 */
function useRowHeight(drawn: boolean): {row: React.RefObject<View | null>; height: number} {
  const row = useRef<View>(null);
  const [height, setHeight] = useState(0);
  const read = useCallback(() => {
    // A react-native-web view's ref is its DOM element.
    const element = row.current as unknown as HTMLElement | null;
    setHeight(element ? element.offsetHeight : 0);
  }, []);
  useLayoutEffect(read);
  useEffect(() => {
    // A static render has no observer, and nothing to resize.
    if (!drawn || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(row.current as unknown as HTMLElement);
    return () => observer.disconnect();
  }, [drawn, read]);
  return {row, height};
}

/**
 * Whether the bar's row fits what is in it. The row is as wide as the window
 * allows and clips what it cannot hold, so when its content is wider than it
 * is, the tabs drop their labels (`NarrowBarContext`) and the row is read
 * again. The width the labelled content needed is kept, and the labels come
 * back once the row is that wide again, so the bar does not flip between
 * the two states at one width. The row is read after every render, since
 * what is in it changes with the screen (a folded header), and on a resize.
 *
 * The logo slot shrinks before the tabs do, so a title in it is bounded by
 * the bar rather than the row overflowing. What the slot holds besides the
 * title does not shrink past its floor (the mark, the app's name, the short
 * field a search shrinks to), so a slot squeezed below that overflows itself
 * while the row still reads as fitting. That deficit is the row's too: it is
 * counted with the row's overflow, and in the width the labels wait for.
 */
function useFit(): {row: React.RefObject<View | null>; logo: React.RefObject<View | null>; narrow: boolean} {
  const row = useRef<View>(null);
  const logo = useRef<View>(null);
  const [narrow, setNarrow] = useState(false);
  const needed = useRef(0);
  const check = useCallback(() => {
    // A react-native-web view's ref is its DOM element; the row and the slot
    // are always rendered, so both are set by the time an effect or the
    // observer runs.
    const {clientWidth, scrollWidth} = row.current as unknown as HTMLElement;
    const slot = logo.current as unknown as HTMLElement;
    const squeezed = Math.max(0, slot.scrollWidth - slot.clientWidth);
    const content = scrollWidth + squeezed;
    if (!narrow && content > clientWidth) {
      needed.current = content;
      setNarrow(true);
    } else if (narrow && clientWidth >= needed.current) {
      setNarrow(false);
    }
  }, [narrow]);
  useLayoutEffect(check);
  useEffect(() => {
    // A static render has no observer, and nothing to resize.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(check);
    observer.observe(row.current as unknown as HTMLElement);
    return () => observer.disconnect();
  }, [check]);
  return {row, logo, narrow};
}

/** A pushed screen's back button, at the mark's size and in its place. */
function BackButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      accessibilityLabel="Go back"
      style={({pressed}) => [styles.back, pressed && styles.pressed]}>
      <SymbolView
        name={{web: 'arrow_back', ios: 'chevron.left', android: 'arrow_back'}}
        size={20}
        tintColor={theme.label}
      />
    </Pressable>
  );
}

export function TabLink({children, isFocused, icon, badge, ...props}: TabTriggerSlotProps & {icon: TabRoute['icon']; badge?: TabRoute['badge']}) {
  // In a bar too narrow for its labels the icon stands alone, and the name
  // becomes the link's accessible name instead.
  const narrow = useNarrowBar();
  const token = routeToken(icon);
  return (
    // The tab standing for the route being shown is the current page, which is
    // what a screen reader announces to say where you are. Nothing else in the
    // bar said so before: every tab read identically.
    <Pressable
      {...props}
      aria-current={isFocused ? 'page' : undefined}
      aria-label={narrow && typeof children === 'string' ? children : undefined}
      style={({pressed}) => pressed && styles.pressed}>
      <View style={styles.link}>
        <Icon icon={token} size={18} tone={isFocused ? 'label' : 'secondary'}/>
        {narrow ? null : <Label color={isFocused ? 'label' : 'secondaryLabel'}>{children}</Label>}
        {badge ? (
          <View style={styles.badge} testID="tab-badge">
            <Label color="onTint">{String(badge)}</Label>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** The bar's height: what its tabs need, and what a folded header gets. */
const BAR_HEIGHT = 56;

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  // The bar and the search row under it, floating over the screens.
  block: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    padding: spacing.three,
    gap: spacing.two,
  },
  list: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  hidden: {
    display: 'none',
  },
  badge: {
    minWidth: 18,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: theme.tint,
  },
  inner: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: bound.contentMaxWidth,
    // The row never grows past the window: it shrinks to what it is given and
    // clips what it cannot hold, so the page never scrolls sideways; what it
    // cannot hold is what makes it drop its labels (`useFit`).
    minWidth: 0,
    flexShrink: 1,
    overflow: 'hidden',
    // Fixed, so a screen's folded header — a menu at the header's size, a
    // button — cannot make the bar taller than its own tabs do.
    height: BAR_HEIGHT,
    paddingHorizontal: spacing.five,
    gap: spacing.three,
    borderRadius: spacing.five,
  },
  solid: {
    backgroundColor: theme.backgroundElement,
  },
  // The search row: the field in a pill of the bar's fill, the bar's width.
  searchRow: {
    width: '100%',
    maxWidth: bound.contentMaxWidth,
    height: FOLDED_SEARCH_INSET - spacing.two,
    justifyContent: 'center',
    paddingHorizontal: spacing.two,
    borderRadius: spacing.five,
  },
  // The accessory row: the screen's own content in a pill of the bar's fill, the bar's width.
  accessoryRow: {
    width: '100%',
    maxWidth: bound.contentMaxWidth,
    paddingHorizontal: spacing.two,
    borderRadius: spacing.five,
    overflow: 'hidden',
  },
  // The slot takes the row's spare width, which is the gap before the actions
  // and the tabs, or the room a search in it grows into. It shrinks before
  // the tabs do, so a title in it is bounded by the bar (`useFit`).
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: spacing.two,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: spacing.two,
  },
  back: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.three,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});

import type {TabTriggerSlotProps, TabListProps} from 'expo-router/ui';
import type {ReactNode} from 'react';
import type {HeaderSlot} from './context';
import type {TabBarProps, TabRoute, WebLogo} from './types';

import {Tabs as WebTabs, TabSlot, TabList, TabTrigger} from 'expo-router/ui';
import {View, Pressable, StyleSheet} from 'react-native';
import {useState, useSyncExternalStore} from 'react';
import {SymbolView} from 'expo-symbols';
import {Image} from 'expo-image';
import app from 'expo-constants';

import {theme, spacing, bound} from '../theme';
import {HeaderSlotContext, InBarContext, TabBarContext, createHeaderSlot, noSubscription} from './context';
import {Headline, Label} from '../typography';

export function Tabs({
  routes,
  hidden = false,
  webLogo = 'icon-and-text',
  webIcon,
  webActions,
  webActionsPlacement = 'before',
  webFoldHeader = true,
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
  return (
    <HeaderSlotContext.Provider value={slot}>
      {/* The bar floats over the screens; what is under it leaves its space clear. */}
      <TabBarContext.Provider value={shown}>
        <WebTabs>
          <TabSlot style={styles.slot}/>
          {/* The triggers stay in the list even while the bar is hidden: that is where the router looks for the routes. */}
          <TabList asChild>
            <WebTabList logo={webLogo} icon={webIcon} slot={slot} hidden={hidden} shown={shown} actions={webActions} actionsPlacement={webActionsPlacement}>
              {routes.map(route => (
                <TabTrigger key={route.name} name={route.name} href={route.href} asChild>
                  <TabLink icon={route.icon}>{route.label}</TabLink>
                </TabTrigger>
              ))}
            </WebTabList>
          </TabList>
        </WebTabs>
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
}

export function WebTabList({logo, icon, slot, hidden = false, shown = true, actions, actionsPlacement = 'before', ...props}: WebTabListProps) {
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
  const mark = isPreset
    ? !isTextOnly && icon != null && (
      <Image
        style={styles.icon}
        source={icon}
        contentFit="contain"
      />
    )
    : title == null && logo;
  return (
    <View {...props} testID="tab-bar" style={[styles.list, !shown && styles.hidden]}>
      <View testID="tab-bar-row" style={styles.inner}>
        <View style={styles.logo}>
          {header?.onBack ? <BackButton onPress={header.onBack}/> : mark}
          {title != null ? (
            <Headline color="label" numberOfLines={1} style={styles.title}>
              {title}
            </Headline>
          ) : isPreset && !isIconOnly ? (
            <Headline color="label">
              {app.expoConfig?.name}
            </Headline>
          ) : null}
        </View>
        <InBarContext.Provider value={true}>
          {actionsPlacement === 'before' ? trailing : null}
          <View testID="tab-bar-tabs" style={[styles.tabs, hidden && styles.hidden]}>
            {props.children}
          </View>
          {actionsPlacement === 'after' ? trailing : null}
        </InBarContext.Provider>
      </View>
    </View>
  );
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

export function TabLink({children, isFocused, icon, ...props}: TabTriggerSlotProps & {icon: TabRoute['icon']}) {
  return (
    <Pressable {...props} style={({pressed}) => pressed && styles.pressed}>
      <View style={styles.link}>
        <SymbolView name={icon} size={18} tintColor={isFocused ? theme.label : theme.secondaryLabel}/>
        <Label color={isFocused ? 'label' : 'secondaryLabel'}>{children}</Label>
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
  list: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: spacing.three,
  },
  hidden: {
    display: 'none',
  },
  inner: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: bound.contentMaxWidth,
    // Fixed, so a screen's folded header — a menu at the header's size, a
    // button — cannot make the bar taller than its own tabs do.
    height: BAR_HEIGHT,
    paddingHorizontal: spacing.five,
    gap: spacing.three,
    borderRadius: spacing.five,
    backgroundColor: theme.backgroundElement,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
    gap: spacing.two,
    // The slot shrinks before the tabs do, so a title in it is bounded by the bar.
    flexShrink: 1,
    minWidth: 0,
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

import type {TabTriggerSlotProps, TabListProps} from 'expo-router/ui';
import type {ReactNode} from 'react';
import type {TabBarProps, TabRoute, WebLogo} from './types';

import {Tabs as WebTabs, TabSlot, TabList, TabTrigger} from 'expo-router/ui';
import {View, Pressable, StyleSheet} from 'react-native';
import {SymbolView} from 'expo-symbols';
import {Image} from 'expo-image';
import app from 'expo-constants';

import {theme, spacing, bound} from '../theme';
import {Headline, Label} from '../typography';

export function Tabs({
  routes,
  hidden = false,
  webLogo = 'icon-and-text',
  webIcon,
  webActions,
  webActionsPlacement = 'before',
}: TabBarProps) {
  return (
    <WebTabs>
      <TabSlot style={styles.slot}/>
      {/* The triggers stay in the list even while the bar is hidden: that is where the router looks for the routes. */}
      <TabList asChild>
        <WebTabList logo={webLogo} icon={webIcon} hidden={hidden} actions={webActions} actionsPlacement={webActionsPlacement}>
          {routes.map(route => (
            <TabTrigger key={route.name} name={route.name} href={route.href} asChild>
              <TabLink icon={route.icon}>{route.label}</TabLink>
            </TabTrigger>
          ))}
        </WebTabList>
      </TabList>
    </WebTabs>
  );
}

interface WebTabListProps extends TabListProps {
  logo: WebLogo;
  icon?: TabBarProps['webIcon'];
  hidden?: boolean;
  actions?: ReactNode;
  actionsPlacement?: 'before' | 'after';
}

export function WebTabList({logo, icon, hidden = false, actions, actionsPlacement = 'before', ...props}: WebTabListProps) {
  const isPreset = typeof logo === 'string';
  const isTextOnly = logo === 'text-only';
  const isIconOnly = logo === 'icon-only';
  return (
    <View {...props} style={[styles.list, hidden && styles.hidden]}>
      <View style={styles.inner}>
        <View style={styles.logo}>
          {!isPreset ? logo : (
            <>
              {!isTextOnly && icon != null && (
                <Image
                  style={styles.icon}
                  source={icon}
                  contentFit="contain"
                />
              )}
              {!isIconOnly && (
                <Headline color="label">
                  {app.expoConfig?.name}
                </Headline>
              )}
            </>
          )}
        </View>
        {actionsPlacement === 'before' ? actions : null}
        {props.children}
        {actionsPlacement === 'after' ? actions : null}
      </View>
    </View>
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
    paddingHorizontal: spacing.five,
    paddingVertical: spacing.three,
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
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});

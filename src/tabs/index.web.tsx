import type {TabTriggerSlotProps, TabListProps} from 'expo-router/ui';
import type {TabBarProps, TabRoute, WebLogo} from './types';

import {Tabs as WebTabs, TabSlot, TabList, TabTrigger} from 'expo-router/ui';
import {View, Pressable, StyleSheet} from 'react-native';
import {SymbolView} from 'expo-symbols';
import {Image} from 'expo-image';
import app from 'expo-constants';

import {theme, spacing, bound} from '../theme';
import {Headline, Label} from '../typography';

export function Tabs({routes, webLogo = 'icon-and-text', webIcon}: TabBarProps) {
  return (
    <WebTabs>
      <TabSlot style={styles.slot}/>
      <TabList asChild>
        <WebTabList logo={webLogo} icon={webIcon}>
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

export function WebTabList({logo, icon, ...props}: TabListProps & {logo: WebLogo, icon?: TabBarProps['webIcon']}) {
  const isPreset = typeof logo === 'string';
  const isTextOnly = logo === 'text-only';
  const isIconOnly = logo === 'icon-only';
  return (
    <View {...props} style={styles.list}>
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
        {props.children}
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

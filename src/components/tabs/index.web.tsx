import type {TabTriggerSlotProps, TabListProps} from 'expo-router/ui';
import type {TabBarProps, TabRoute} from './types';

import {Tabs as WebTabs, TabSlot, TabList, TabTrigger} from 'expo-router/ui';
import {View, Pressable, StyleSheet} from 'react-native';
import {SymbolView} from 'expo-symbols';
import app from 'expo-constants';

import {theme, spacing, bound} from '@/ui/theme';
import {Headline, Label} from '@/ui/typography';

export function Tabs({routes}: TabBarProps) {
  return (
    <WebTabs>
      <TabSlot style={styles.slot}/>
      <TabList asChild>
        <WebTabList>
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

export function WebTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.list}>
      <View style={styles.inner}>
        <Headline style={styles.logo} color="label">
          {app.expoConfig?.name}
        </Headline>
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
    marginRight: 'auto',
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

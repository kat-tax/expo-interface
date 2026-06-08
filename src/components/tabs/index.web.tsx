import type {TabTriggerSlotProps, TabListProps} from 'expo-router/ui';
import {Tabs as WebTabs, TabSlot, TabList, TabTrigger} from 'expo-router/ui';
import {View, Pressable, StyleSheet} from 'react-native';
import {theme, spacing, bound} from '@/ui/theme';
import {Headline, Label} from '@/ui/typography';

export function Tabs() {
  return (
    <WebTabs>
      <TabSlot style={styles.slot}/>
      <TabList asChild>
        <WebTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabLink>Home</TabLink>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabLink>Settings</TabLink>
          </TabTrigger>
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
          dropfiles.io
        </Headline>
        {props.children}
      </View>
    </View>
  );
}

export function TabLink({children, isFocused, ...props}: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({pressed}) => pressed && styles.pressed}>
      <Label color={isFocused ? 'label' : 'secondaryLabel'}>
        {children}
      </Label>
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
    padding: spacing.three,
    width: '100%',
  },
  inner: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.three,
    maxWidth: bound.contentMaxWidth,
    paddingHorizontal: spacing.five,
    paddingVertical: spacing.three,
    borderRadius: spacing.five,
    backgroundColor: theme.backgroundElement,
  },
  logo: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});

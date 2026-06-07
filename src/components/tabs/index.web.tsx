import {View, Pressable, StyleSheet} from 'react-native';
import {Tabs as WebTabs, TabSlot, TabList, TabTrigger, TabListProps, TabTriggerSlotProps} from 'expo-router/ui';
import {theme, spacing, bound} from '@/ui/theme';
import {Headline, Label} from '@/ui/typography';

export function Tabs() {
  return (
    <WebTabs>
      <TabSlot style={{height: '100%'}}/>
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
    <View {...props} style={styles.root}>
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
  root: {
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
    paddingVertical: spacing.three,
    paddingHorizontal: spacing.five,
    borderRadius: spacing.five,
    gap: spacing.three,
    maxWidth: bound.contentMaxWidth,
    backgroundColor: theme.backgroundElement,
  },
  logo: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});

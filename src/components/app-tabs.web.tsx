import {View, Pressable, StyleSheet} from 'react-native';
import {Tabs, TabSlot, TabList, TabTrigger, TabListProps, TabTriggerSlotProps} from 'expo-router/ui';
import {colors, Spacing, BoxMaxWidth} from '@/ui/theme';
import {Headline, Label} from '@/ui/typography';

export default function AppTabs() {
  return (
    <Tabs>
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
    </Tabs>
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
      <Label color={isFocused ? 'label' : 'secondary'}>
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
    padding: Spacing.three,
    width: '100%',
  },
  inner: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    gap: Spacing.three,
    maxWidth: BoxMaxWidth,
    backgroundColor: colors.backgroundElement,
  },
  logo: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});

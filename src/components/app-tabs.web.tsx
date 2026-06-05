import type {Href} from 'expo-router';
import {SymbolView} from 'expo-symbols';
import {
  Text,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  Tabs,
  TabSlot,
  TabList,
  TabTrigger,
  TabListProps,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import {Spacing} from '@/constants/theme';
import {ExternalLink} from './external-link';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <WebTabList>
          <TabTrigger name="home" href="/" asChild>
            <LinkInternal>Home</LinkInternal>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <LinkInternal>Settings</LinkInternal>
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
        <Text style={styles.logo}>
          DropFiles
        </Text>
        {props.children}
      </View>
    </View>
  );
}

function LinkInternal({children, isFocused, ...props}: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({pressed}) => pressed && styles.pressed}>
      <Text style={[
        styles.link,
        styles.linkInternal,
        isFocused && styles.linkFocused,
      ]}>
        {children}
      </Text>
    </Pressable>
  );
}

function LinkExternal({href, children}: {href: Href & string, children: React.ReactNode}) {
  return (
    <ExternalLink href={href} asChild>
      <Pressable style={styles.linkExternalPressable}>
        <Text style={[
          styles.link,
          styles.linkExternal,
        ]}>
          {children}
        </Text>
        <SymbolView
          tintColor={'#666'}
          size={12}
          name={{
            ios: 'arrow.up.right.square',
            web: 'link',
          }}
        />
      </Pressable>
    </ExternalLink>
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
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    gap: Spacing.three,
    maxWidth: 800,
    backgroundColor: '#222',
  },
  logo: {
    marginRight: 'auto',
    color: '#EEE',
  },
  link: {
    color: '#999',
  },
  linkFocused: {
    color: '#FFF',
  },
  linkInternal: {
    color: '#999',
  },
  linkExternal: {
    color: '#666',
  },
  linkExternalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.three,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});

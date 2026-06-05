import type {Href} from 'expo-router';

import {SymbolView} from 'expo-symbols';
import {View, Pressable, StyleSheet} from 'react-native';
import {Tabs, TabSlot, TabList, TabTrigger, TabListProps, TabTriggerSlotProps} from 'expo-router/ui';
import {ExternalLink} from '@/components/ui/external-link';
import {Headline, Label} from '@/components/ui/typography';
import {colors, Spacing, BoxMaxWidth} from '@/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{height: '100%'}}/>
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
        <Headline style={styles.logo} color="label">
          dropfiles.io
        </Headline>
        {props.children}
      </View>
    </View>
  );
}

function LinkInternal({children, isFocused, ...props}: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({pressed}) => pressed && styles.pressed}>
      <Label color={isFocused ? 'label' : 'secondary'}>
        {children}
      </Label>
    </Pressable>
  );
}

function LinkExternal({href, children}: {href: Href & string, children: React.ReactNode}) {
  return (
    <ExternalLink href={href} asChild>
      <Pressable style={styles.linkExternalPressable}>
        <Label color="tertiary">
          {children}
        </Label>
        <SymbolView
          tintColor={colors.tertiaryLabel as string}
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

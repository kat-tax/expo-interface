import type {Meta, StoryObj} from '@storybook/react-native';
import type {TabRoute} from './types';
import {fn} from 'storybook/test';
import {router} from 'expo-router';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {Fab} from '../fab';
import {NativeHost} from '../host';
import {Stack} from '../router/stack';
import {Screen} from '../screen';
import {ToastProvider, useToast} from '../toast/provider';
import {Headline, Title} from '../typography';
import * as icons from '../__stories__/icons';
import {Page, RouterApp} from '../__stories__/router';
import {Tabs} from '.';

const routes: TabRoute[] = [
  {href: '/', name: 'index', label: 'Drops', icon: {ios: 'arrow.down.square', android: 'download', web: 'download'}},
  {href: '/starred', name: 'starred', label: 'Starred', icon: {ios: 'star', android: 'star', web: 'star'}, badge: 2},
  {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}, windowsPlacement: 'settings'},
];

const screens = {
  index: () => <Page title="Drops" body="Everything you have shared, newest first."/>,
  starred: () => <Page title="Starred" body="The two drops you keep coming back to."/>,
  settings: () => <Page title="Settings" body="How long a drop lasts, and who may open it."/>,
};

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: {
    docs: {story: {inline: false, height: '380px'}, description: {component: 'The app’s sections: native tabs on iOS and Android, a floating top bar with a logo on web, a WinUI `NavigationView` on Windows. One `routes` list feeds all four, and a route carries its badge and its Windows placement with it.'}},
    // A navigator holds plain React Native screens, not @expo/ui content.
    native: false,
  },
  args: {
    routes,
    // The `icon-and-text` preset draws the app's icon and the name in its
    // Expo config; a Storybook built by Vite has no config to read, so the
    // slot takes a node of its own here.
    webLogo: <Headline color="label" level={false}>Drops</Headline>,
  },
  render: args => <RouterApp routes={{...screens, _layout: () => <Tabs {...args}/>}}/>,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bar as an app gets it: the app name in the web logo slot, a badge on a tab. */
export const Default: Story = {};

/** A control beside the tabs, before them by default (web). */
export const WithActions: Story = {
  args: {
    webActions: <Button label="New drop" prefixIcon={icons.add} variant="text" size="small" onPress={fn()}/>,
    webActionsPlacement: 'after',
  },
};

/**
 * The bar hidden for a screen that wants the whole display. The routes stay,
 * so the screens still navigate.
 */
export const Hidden: Story = {
  args: {hidden: true},
};

/**
 * The bar as a material (web): its fill thinned over a blur of what scrolls
 * under it, with a hairline and a soft shadow at its edge. Content passes
 * under it on a `Screen underBar`.
 */
export const Glass: Story = {
  args: {webMaterial: 'regular'},
};

/**
 * The app's mark drawn in the label color (web), from an image rather than an
 * icon token: its shape filled through a CSS mask, so it follows the scheme,
 * a forced one included, and takes the text color in forced colors.
 */
export const TintedMark: Story = {
  args: {
    webLogo: 'icon-only',
    webIcon: {uri: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 2C8 7 5 10.5 5 14a7 7 0 0 0 14 0c0-3.5-3-7-7-12z\'/%3E%3C/svg%3E'},
    webTintIcon: true,
  },
};

/**
 * A screen of the toast app: a button that shows the app's toast, and a fab
 * of its own, which lifts above the toast while it shows.
 */
function ToastScreen({title, pushed = false}: {title: string; pushed?: boolean}) {
  const toast = useToast();
  return (
    <Screen gutter fab={<Fab label="Share" icon={icons.share} onPress={fn()}/>}>
      <View style={styles.page}>
        <Title>{title}</Title>
        <NativeHost fit>
          <Button label="Show a toast" onPress={() => toast.show({message: 'Moved to the bin', action: {label: 'Undo', onPress: fn()}})}/>
        </NativeHost>
        <NativeHost fit>
          {pushed
            ? <Button label="Back to the tabs" variant="outlined" onPress={() => router.back()}/>
            : <Button label="Open a drop" variant="outlined" onPress={() => router.push('/detail')}/>}
        </NativeHost>
      </View>
    </Screen>
  );
}

/**
 * The app's toast over the tabs: a `ToastProvider` around the root stack
 * stands each toast above the tab bar on iOS and Android, and above its
 * bottom accessory on iOS 26. The tabs' floating action and a screen's fab
 * lift above it, and on a screen the stack pushes over the tabs it comes
 * down to the safe area.
 */
export const WithToast: Story = {
  args: {action: {label: 'New drop', icon: icons.add, onPress: fn()}},
  render: args => (
    <RouterApp
      routes={{
        _layout: () => (
          <ToastProvider>
            <Stack screenOptions={{headerShown: false}}/>
          </ToastProvider>
        ),
        '(tabs)/_layout': () => <Tabs {...args}/>,
        '(tabs)/index': () => <ToastScreen title="Drops"/>,
        '(tabs)/starred': () => <ToastScreen title="Starred"/>,
        '(tabs)/settings': () => <ToastScreen title="Settings"/>,
        detail: () => <ToastScreen title="A drop" pushed/>,
      }}
    />
  ),
};

const styles = StyleSheet.create({
  page: {gap: 8, paddingVertical: 16},
});

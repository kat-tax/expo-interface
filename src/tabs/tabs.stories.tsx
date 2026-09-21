import type {Meta, StoryObj} from '@storybook/react-native';
import type {TabRoute} from './types';
import {fn} from 'storybook/test';
import {Button} from '../button';
import {Headline} from '../typography';
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

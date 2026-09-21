import type {Meta, StoryObj} from '@storybook/react-native';
import type {TabRoute} from '../tabs/types';
import type {TabStackProps} from '.';
import {Link} from 'expo-router';
import {Body} from '../typography';
import {HeaderMenu} from '../header-menu';
import {Tabs} from '../tabs';
import * as icons from '../__stories__/icons';
import {Page, RouterApp} from '../__stories__/router';
import {TabStack} from '.';

const routes: TabRoute[] = [
  {href: '/drops', name: 'drops', label: 'Drops', icon: {ios: 'arrow.down.square', android: 'download', web: 'download'}},
  {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
];

const screens = {
  _layout: () => <Tabs routes={routes}/>,
  'drops/index': () => (
    <Page title="Drops" body="The tab’s root screen, under the header this stack gives it.">
      <Link href="/drops/detail">
        <Body color="tint">Holiday photos</Body>
      </Link>
    </Page>
  ),
  'drops/detail': () => <Page title="Holiday photos" body="12 files, shared until Friday."/>,
  settings: () => <Page title="Settings" body="How long a drop lasts, and who may open it."/>,
};

/** The routes, with the tab's stack built from the story's own props. */
const app = (props: TabStackProps) => ({...screens, 'drops/_layout': () => <TabStack {...props}/>});

const meta = {
  title: 'Navigation/TabStack',
  component: TabStack,
  parameters: {
    docs: {description: {component: 'The stack inside a tab, with the platform’s header over it: the native bar on iOS and Android, `ConstrainedStackHeader` on web, and under a web tab bar that takes headers, the bar itself.'}},
    // A navigator holds plain React Native screens, not @expo/ui content.
    native: false,
  },
  args: {
    title: 'Drops',
    headerRight: () => (
      <HeaderMenu label="Export" icon={icons.share} hideLabel items={[{label: 'PDF'}, {label: 'Markdown'}]}/>
    ),
  },
  render: args => <RouterApp routes={app(args)} url="/drops"/>,
} satisfies Meta<typeof TabStack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The tab’s root screen: the title on the left, the trailing menu on the right. */
export const Root: Story = {};

/** A pushed screen, which adds the back control to the same header. */
export const Pushed: Story = {
  render: args => <RouterApp routes={app(args)} url="/drops/detail"/>,
};

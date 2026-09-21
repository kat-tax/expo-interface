import type {Meta, StoryObj} from '@storybook/react-native';
import {Link} from 'expo-router';
import {Body} from '../typography';
import {Page, RouterApp} from '../__stories__/router';
import {Stack} from './stack';

const app = {
  _layout: () => (
    <Stack>
      <Stack.Screen name="index" options={{title: 'Drops'}}/>
      <Stack.Screen name="detail" options={{title: 'Holiday photos'}}/>
    </Stack>
  ),
  index: () => (
    <Page header title="Drops" body="Everything you have shared, newest first.">
      <Link href="/detail">
        <Body color="tint">Holiday photos</Body>
      </Link>
    </Page>
  ),
  detail: () => <Page header title="Holiday photos" body="12 files, shared until Friday."/>,
};

const meta = {
  title: 'Navigation/Stack',
  component: Stack,
  parameters: {
    docs: {description: {component: 'The platform’s stack navigator: Expo Router’s native stack on iOS, Android and web, and a stack of the kit’s own on Windows. These stories mount a two screen app in a router of their own.'}},
    // A navigator holds plain React Native screens, not @expo/ui content.
    native: false,
    // The app fills what it is given, so a docs page has to give it a size.
    height: 360,
  },
  render: () => <RouterApp routes={app}/>,
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The root screen, with the link that pushes the second one. */
export const Root: Story = {};

/** The pushed screen, with the back control the platform puts in its header. */
export const Pushed: Story = {
  render: () => <RouterApp routes={app} url="/detail"/>,
};

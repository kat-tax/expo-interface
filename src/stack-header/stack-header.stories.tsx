import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {Link} from 'expo-router';
import {Body} from '../typography';
import {HeaderAction} from '../header-action';
import {Stack} from '../router/stack';
import * as icons from '../__stories__/icons';
import {Page, RouterApp} from '../__stories__/router';
import {ConstrainedStackHeader} from '.';

const app = {
  _layout: () => (
    <Stack screenOptions={{headerShown: true, header: ConstrainedStackHeader}}>
      <Stack.Screen name="index" options={{title: 'Drops'}}/>
      <Stack.Screen
        name="detail"
        options={{
          title: 'Holiday photos',
          headerRight: () => <HeaderAction label="Share" icon={icons.share} hideLabel onPress={fn()}/>,
        }}
      />
    </Stack>
  ),
  index: () => (
    <Page title="Drops" body="The header above is the same width as this content.">
      <Link href="/detail">
        <Body color="tint">Holiday photos</Body>
      </Link>
    </Page>
  ),
  detail: () => <Page title="Holiday photos" body="12 files, shared until Friday."/>,
};

const meta = {
  title: 'Navigation/ConstrainedStackHeader',
  component: ConstrainedStackHeader,
  parameters: {
    docs: {description: {component: 'The web stack header, matched to the content’s width so a screen and its header line up. It is web only: on the other platforms the native stack draws its own bar and this renders nothing.'}},
    // A navigator holds plain React Native screens, not @expo/ui content.
    native: false,
  },
  render: () => <RouterApp routes={app}/>,
} satisfies Meta<typeof ConstrainedStackHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The root screen: the title alone. */
export const Root: Story = {};

/** A pushed screen: the back control, the title and the trailing slot. */
export const Pushed: Story = {
  render: () => <RouterApp routes={app} url="/detail"/>,
};

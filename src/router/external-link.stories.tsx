import type {Meta, StoryObj} from '@storybook/react-native';
import {Body} from '../typography';
import {Page, RouterApp} from '../__stories__/router';
import {ExternalLink} from './external-link';

const meta = {
  title: 'Navigation/ExternalLink',
  component: ExternalLink,
  parameters: {
    docs: {story: {inline: false, height: '380px'}, description: {component: 'A link to a URL outside the app: an in-app browser on iOS and Android, a new tab on web, the default browser on Windows. It is an Expo Router `Link`, so it needs the router around it.'}},
    // A link is plain React Native text, not @expo/ui content.
    native: false,
  },
  args: {href: 'https://docs.expo.dev'},
  render: args => (
    <RouterApp
      routes={{
        index: () => (
          <Page title="About" body="Where the app sends a reader who wants the details.">
            <ExternalLink {...args}>
              <Body color="tint">Expo documentation</Body>
            </ExternalLink>
          </Page>
        ),
      }}
    />
  ),
} satisfies Meta<typeof ExternalLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The link as a screen would carry it. */
export const Default: Story = {};

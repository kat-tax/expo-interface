import type {Meta, StoryObj} from '@storybook/react-native';
import * as icons from '../__stories__/icons';
import {ShareLink} from '.';

const meta = {
  title: 'Navigation/ShareLink',
  component: ShareLink,
  parameters: {
    docs: {
      description: {
        component:
          'A button that hands something to the platform\'s share sheet — native on all four, through four different doors: SwiftUI\'s own `ShareLink` on iOS, React Native\'s `Share` on Android, `navigator.share` on web, and the kit\'s own `DataTransferManager` module on Windows, where React Native\'s `Share` does not dispatch at all.',
      },
    },
  },
  args: {
    label: 'Share',
    url: 'https://expo.dev',
    icon: icons.share,
  },
} satisfies Meta<typeof ShareLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Link: Story = {};

export const WithMessage: Story = {
  args: {message: 'Have a look at this drop', title: 'HIS-201 Midterm Essay'},
};

/** Nothing to share means nothing to press: an empty sheet is no use. */
export const Empty: Story = {args: {url: undefined}};

export const IconOnly: Story = {args: {hideLabel: true, variant: 'text'}};

import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import * as icons from '../__stories__/icons';
import {EmptyState} from '.';

const meta = {
  title: 'Layout/EmptyState',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          'What a screen shows when it has nothing to show. iOS 17 and later render the system\'s own `ContentUnavailableView`, and older iOS compose the same layout in SwiftUI; Android composes it in Compose; the web and Windows draw it from the kit\'s icon and typography, because none of them has a single control for it.',
      },
    },
  },
  args: {
    title: 'No drops yet',
    description: 'Anything you share will show up here.',
    icon: icons.add,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

/** A search that found nothing is a different message from a screen never used. */
export const NoResults: Story = {
  args: {title: 'No results', description: 'Try a shorter word.', icon: icons.info},
};

/** Usually there is one thing to do about it: the kit's button, drawn inside the platform's own view. */
export const WithAction: Story = {
  args: {action: {label: 'New drop', icon: icons.add, onPress: fn()}},
};

/** What is missing is on its way: the platform's spinner where the icon goes. */
export const Loading: Story = {
  args: {title: 'Opening', description: 'One moment.', loading: true, action: {label: 'Cancel', variant: 'text', onPress: fn()}},
};

export const TitleOnly: Story = {
  args: {description: undefined, icon: undefined},
};

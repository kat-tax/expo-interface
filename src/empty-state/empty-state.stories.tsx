import type {Meta, StoryObj} from '@storybook/react-native';
import {Button} from '../button';
import * as icons from '../__stories__/icons';
import {EmptyState} from '.';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          'What a screen shows when it has nothing to show. iOS 17 and later render the system\'s own `ContentUnavailableView`; every other platform, and older iOS, draw the same column from the kit\'s icon and typography, because none of them has a single control for it.',
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

/** Usually there is one thing to do about it. */
export const WithAction: Story = {
  args: {action: <Button label="New drop" variant="filled"/>},
};

export const TitleOnly: Story = {
  args: {description: undefined, icon: undefined},
};

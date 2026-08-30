import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {Button} from '../button';
import {ScreenHeader} from './header';

const meta = {
  title: 'Layout/ScreenHeader',
  component: ScreenHeader,
  // Plain React Native views; no `@expo/ui` Host needed.
  parameters: {native: false},
  args: {
    title: 'Settings',
    onBack: fn(),
  },
} satisfies Meta<typeof ScreenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBack: Story = {};

export const Root: Story = {
  args: {onBack: undefined},
};

export const Trailing: Story = {
  args: {
    title: 'Edit profile',
    trailing: <Button label="Save" variant="text" onPress={fn()}/>,
  },
};

export const LongTitle: Story = {
  args: {
    title: 'A very long screen title that has to truncate on a single line',
    trailing: <Button label="Done" variant="text" onPress={fn()}/>,
  },
};

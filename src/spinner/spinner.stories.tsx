import type {Meta, StoryObj} from '@storybook/react-native';
import {Spinner} from '.';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {docs: {description: {component: 'The platform\'s activity indicator while something is on its way — an indeterminate `Progress` ring, in a host of its own when it sits in a React Native layout.'}}},
  args: {
    size: 24,
  },
  argTypes: {
    size: {control: {type: 'range', min: 16, max: 64, step: 4}},
    color: {control: 'color'},
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const Large: Story = {
  args: {size: 48},
};

export const Colored: Story = {
  args: {color: '#8959EA'},
};

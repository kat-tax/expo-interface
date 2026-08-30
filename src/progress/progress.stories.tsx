import type {Meta, StoryObj} from '@storybook/react-native';
import {Column, Row, Text} from '@expo/ui';
import {fillWidth} from '../fill';
import {Progress} from '.';

const meta = {
  title: 'Components/Progress',
  component: Progress,
  args: {
    value: 0.6,
    variant: 'linear',
    size: 24,
  },
  argTypes: {
    variant: {control: 'select', options: ['linear', 'circular']},
    value: {control: {type: 'range', min: 0, max: 1, step: 0.05}},
    size: {control: 'number'},
    color: {control: 'color'},
    trackColor: {control: 'color'},
  },
  render: args => (
    <Column modifiers={fillWidth}>
      <Progress {...args}/>
    </Column>
  ),
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Linear: Story = {};

export const LinearIndeterminate: Story = {
  args: {value: undefined},
};

export const Circular: Story = {
  args: {variant: 'circular'},
};

export const CircularIndeterminate: Story = {
  args: {variant: 'circular', value: undefined},
};

export const CustomColors: Story = {
  args: {color: '#FF9500', trackColor: '#FFE5B4'},
  render: args => (
    <Column modifiers={fillWidth} spacing={16}>
      <Progress {...args}/>
      <Progress {...args} variant="circular" size={32}/>
    </Column>
  ),
};

export const Sizes: Story = {
  args: {variant: 'circular'},
  render: args => (
    <Row spacing={16}>
      <Progress {...args} size={16}/>
      <Progress {...args} size={24}/>
      <Progress {...args} size={40}/>
      <Progress {...args} size={64}/>
    </Row>
  ),
};

export const Values: Story = {
  render: args => (
    <Column modifiers={fillWidth} spacing={12}>
      <Text>0%</Text>
      <Progress {...args} value={0}/>
      <Text>25%</Text>
      <Progress {...args} value={0.25}/>
      <Text>50%</Text>
      <Progress {...args} value={0.5}/>
      <Text>100%</Text>
      <Progress {...args} value={1}/>
    </Column>
  ),
};

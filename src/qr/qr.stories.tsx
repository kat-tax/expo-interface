import type {Meta, StoryObj} from '@storybook/react-native';
import {View} from 'react-native';
import {Caption} from '../typography';
import {QRCode} from '.';

const meta = {
  title: 'Components/QRCode',
  component: QRCode,
  parameters: {native: false},
  args: {
    value: 'https://expo.dev',
    size: 200,
  },
  argTypes: {
    size: {control: 'number'},
  },
} satisfies Meta<typeof QRCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {size: 96},
};

export const LongValue: Story = {
  args: {
    value: 'https://drops.example.com/d/8f1c2a9e-4b7d-4c3e-9a1f-2d5e6b7c8a90?ref=story&utm_source=storybook',
  },
};

export const Sizes: Story = {
  render: args => (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end'}}>
      <QRCode {...args} size={64}/>
      <QRCode {...args} size={128}/>
      <QRCode {...args} size={192}/>
    </View>
  ),
};

export const WithCaption: Story = {
  render: args => (
    <View style={{alignItems: 'center', gap: 12}}>
      <QRCode {...args}/>
      <Caption color="secondaryLabel">{args.value}</Caption>
    </View>
  ),
};

import type {Meta, StoryObj} from '@storybook/react-native';
import {Column, Row, Text} from '@expo/ui';
import {fillWidth} from '../fill';
import {Divider} from '.';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  args: {
    vertical: false,
  },
  argTypes: {
    color: {control: 'color'},
    inset: {control: 'number'},
  },
  render: args => (
    <Column modifiers={fillWidth} spacing={12}>
      <Text>Above the rule</Text>
      <Divider {...args}/>
      <Text>Below the rule</Text>
    </Column>
  ),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: {vertical: true},
  render: args => (
    <Row spacing={12}>
      <Text>Left</Text>
      <Divider {...args}/>
      <Text>Right</Text>
    </Row>
  ),
};

export const Inset: Story = {
  args: {inset: 32},
};

export const Colored: Story = {
  args: {color: '#FF9500'},
};

export const Stack: Story = {
  render: args => (
    <Column modifiers={fillWidth} spacing={12}>
      <Text>Wi-Fi</Text>
      <Divider {...args}/>
      <Text>Bluetooth</Text>
      <Divider {...args} inset={24}/>
      <Text>Airplane mode</Text>
      <Divider {...args} color="#FF3B30"/>
      <Text>Cellular</Text>
    </Column>
  ),
};

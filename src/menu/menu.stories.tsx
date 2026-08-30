import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {Column, Row} from '@expo/ui';
import {fillWidth} from '../fill';
import * as icons from '../__stories__/icons';
import {Button} from '../button';
import {Menu} from '.';

const meta = {
  title: 'Components/Menu',
  component: Menu,
  args: {
    label: 'Export',
    variant: 'filled',
    size: 'medium',
    disabled: false,
    hideLabel: false,
    items: [
      {label: 'Export drops', icon: icons.share, onPress: fn()},
      {label: 'Add to favorites', icon: icons.star, onPress: fn()},
      {label: 'Clear cache', role: 'destructive', separator: true, icon: icons.trash, onPress: fn()},
    ],
  },
  argTypes: {
    variant: {control: 'select', options: ['filled', 'outlined', 'text']},
    size: {control: 'select', options: ['small', 'medium', 'large']},
    shape: {control: 'select', options: [undefined, 'rounded', 'pill', 'circle']},
    color: {control: 'color'},
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Outlined: Story = {
  args: {variant: 'outlined'},
};

export const Text: Story = {
  args: {variant: 'text'},
};

export const WithIcon: Story = {
  args: {icon: icons.share},
};

export const IconOnly: Story = {
  args: {label: 'More', icon: icons.settings, hideLabel: true, shape: 'circle', variant: 'outlined'},
};

export const CustomColor: Story = {
  args: {label: 'Publish', color: '#FF9500'},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const PlainItems: Story = {
  args: {
    label: 'Sort by',
    variant: 'outlined',
    items: [
      {label: 'Name', onPress: fn()},
      {label: 'Date modified', onPress: fn()},
      {label: 'Size', onPress: fn()},
    ],
  },
};

export const ItemStates: Story = {
  args: {
    label: 'Actions',
    items: [
      {label: 'Rename', onPress: fn()},
      {label: 'Duplicate', disabled: true, onPress: fn()},
      {label: 'Move to…', icon: icons.chevron, onPress: fn()},
      {label: 'Delete', role: 'destructive', separator: true, icon: icons.trash, onPress: fn()},
      {label: 'Delete permanently', role: 'destructive', disabled: true, onPress: fn()},
    ],
  },
};

export const Sizes: Story = {
  render: args => (
    <Column modifiers={fillWidth} spacing={12}>
      <Row spacing={12}>
        <Menu {...args} size="small" label="Small"/>
        <Menu {...args} size="medium" label="Medium"/>
        <Menu {...args} size="large" label="Large"/>
      </Row>
      <Row spacing={12}>
        <Menu {...args} variant="outlined" size="small" label="Small"/>
        <Menu {...args} variant="outlined" size="medium" label="Medium"/>
        <Menu {...args} variant="outlined" size="large" label="Large"/>
      </Row>
    </Column>
  ),
};

export const Toolbar: Story = {
  render: args => (
    <Row spacing={12}>
      <Button label="Upload" prefixIcon={icons.add} onPress={fn()}/>
      <Menu {...args} label="Export" variant="outlined" icon={icons.share}/>
      <Menu {...args} label="More" variant="text" icon={icons.settings} hideLabel/>
    </Row>
  ),
};

import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {Column, Row} from '@expo/ui';
import {fillWidth} from '../fill';
import * as icons from '../__stories__/icons';
import {Button} from '.';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {docs: {description: {component: 'Filled, outlined or text button with optional icons, sizes, shapes and a destructive role. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    label: 'Continue',
    variant: 'filled',
    role: 'default',
    size: 'medium',
    disabled: false,
    hideLabel: false,
    onPress: fn(),
  },
  argTypes: {
    variant: {control: 'select', options: ['filled', 'outlined', 'text']},
    role: {control: 'select', options: ['default', 'destructive']},
    size: {control: 'select', options: ['small', 'medium', 'large']},
    shape: {control: 'select', options: [undefined, 'rounded', 'pill', 'circle']},
    color: {control: 'color'},
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Outlined: Story = {
  args: {variant: 'outlined'},
};

export const Text: Story = {
  args: {variant: 'text'},
};

export const Destructive: Story = {
  args: {label: 'Delete', role: 'destructive', prefixIcon: icons.trash},
};

export const CustomColor: Story = {
  args: {label: 'Publish', color: '#FF9500'},
};

export const WithIcons: Story = {
  args: {label: 'Share', prefixIcon: icons.share, suffixIcon: icons.chevron},
};

export const IconOnly: Story = {
  args: {label: 'Add', prefixIcon: icons.add, hideLabel: true, shape: 'circle'},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const FillWidth: Story = {
  args: {fillWidth: true},
};

export const Sizes: Story = {
  render: args => (
    <Column modifiers={fillWidth} spacing={12}>
      <Row spacing={12}>
        <Button {...args} size="small" label="Small"/>
        <Button {...args} size="medium" label="Medium"/>
        <Button {...args} size="large" label="Large"/>
      </Row>
      <Row spacing={12}>
        <Button {...args} variant="outlined" size="small" label="Small"/>
        <Button {...args} variant="outlined" size="medium" label="Medium"/>
        <Button {...args} variant="outlined" size="large" label="Large"/>
      </Row>
    </Column>
  ),
};

export const Shapes: Story = {
  render: args => (
    <Row spacing={12}>
      <Button {...args} shape="rounded" label="Rounded"/>
      <Button {...args} shape="pill" label="Pill"/>
      <Button {...args} shape="circle" label="Add" prefixIcon={icons.add} hideLabel/>
    </Row>
  ),
};

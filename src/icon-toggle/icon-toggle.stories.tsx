import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {useState} from 'react';
import * as icons from '../__stories__/icons';
import {IconToggle} from '.';

const meta = {
  title: 'Components/IconToggle',
  component: IconToggle,
  parameters: {docs: {description: {component: 'A round icon button with two states — the star on a document, a tool that stays down while it is on. Material 3\'s `IconToggleButton` on Android, a SwiftUI button carrying the selected trait on iOS, an `aria-pressed` button on web.'}}},
  args: {
    label: 'Favourite',
    icon: icons.star,
    value: false,
    size: 24,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    size: {control: {type: 'range', min: 16, max: 48, step: 2}},
    color: {control: 'color'},
    offColor: {control: 'color'},
  },
} satisfies Meta<typeof IconToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: {value: true},
};

export const Disabled: Story = {
  args: {value: true, disabled: true},
};

export const Interactive: Story = {
  render: function Interactive(args) {
    const [value, setValue] = useState(false);
    return <IconToggle {...args} value={value} onValueChange={setValue}/>;
  },
};

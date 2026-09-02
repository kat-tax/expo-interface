import type {Meta, StoryObj} from '@storybook/react-native';
import type {CheckboxProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {Checkbox} from '.';

/** Keeps the controlled checkbox interactive while still reporting to the action log. */
function Controlled({value, onValueChange, ...props}: CheckboxProps) {
  const [checked, setChecked] = useState(value);
  return (
    <Checkbox
      {...props}
      value={checked}
      onValueChange={next => {
        setChecked(next);
        onValueChange(next);
      }}
    />
  );
}

function Form({onValueChange}: Pick<CheckboxProps, 'onValueChange'>) {
  const [state, setState] = useState({terms: false, newsletter: true, updates: false});
  const toggle = (key: keyof typeof state) => (value: boolean) => {
    setState(s => ({...s, [key]: value}));
    onValueChange(value);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <Checkbox label="Accept terms and conditions" value={state.terms} onValueChange={toggle('terms')}/>
      <Checkbox label="Subscribe to newsletter" value={state.newsletter} onValueChange={toggle('newsletter')}/>
      <Checkbox label="Product updates" value={state.updates} onValueChange={toggle('updates')} disabled/>
    </Column>
  );
}

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {docs: {description: {component: 'Checked/unchecked box with a leading label. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    label: 'Remember me',
    value: true,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    accentColor: {control: 'color'},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checked: Story = {};

export const Unchecked: Story = {
  args: {value: false},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const DisabledUnchecked: Story = {
  args: {value: false, disabled: true},
};

export const CustomAccent: Story = {
  args: {label: 'Highlight', accentColor: '#FF9500'},
};

export const NoLabel: Story = {
  args: {label: undefined},
};

export const SignupForm: Story = {
  render: args => <Form onValueChange={args.onValueChange}/>,
};

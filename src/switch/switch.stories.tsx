import type {Meta, StoryObj} from '@storybook/react-native';
import type {SwitchProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {Switch} from '.';

/** Keeps the controlled switch interactive while still reporting to the action log. */
function Controlled({value, onValueChange, ...props}: SwitchProps) {
  const [on, setOn] = useState(value);
  return (
    <Switch
      {...props}
      value={on}
      onValueChange={next => {
        setOn(next);
        onValueChange(next);
      }}
    />
  );
}

function Form({onValueChange}: Pick<SwitchProps, 'onValueChange'>) {
  const [state, setState] = useState({wifi: true, bluetooth: false, airplane: false});
  const toggle = (key: keyof typeof state) => (value: boolean) => {
    setState(s => ({...s, [key]: value}));
    onValueChange(value);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <Switch label="Wi-Fi" value={state.wifi} onValueChange={toggle('wifi')}/>
      <Switch label="Bluetooth" value={state.bluetooth} onValueChange={toggle('bluetooth')}/>
      <Switch label="Airplane mode" value={state.airplane} onValueChange={toggle('airplane')}/>
    </Column>
  );
}

const meta = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {docs: {description: {component: 'On/off toggle with a leading label. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    label: 'Notifications',
    value: true,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    accentColor: {control: 'color'},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = {
  args: {value: false},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const CustomAccent: Story = {
  args: {label: 'Sync', accentColor: '#FF9500'},
};

export const NoLabel: Story = {
  args: {label: undefined},
};

export const SettingsForm: Story = {
  render: args => <Form onValueChange={args.onValueChange}/>,
};

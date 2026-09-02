import type {Meta, StoryObj} from '@storybook/react-native';
import type {PickerProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {Picker} from '.';

/** Keeps the controlled picker interactive while still reporting to the action log. */
function Controlled({selectedValue, onValueChange, children, ...props}: PickerProps) {
  const [value, setValue] = useState(selectedValue);
  return (
    <Picker
      {...props}
      selectedValue={value}
      onValueChange={next => {
        setValue(next);
        onValueChange?.(next);
      }}>
      {children}
    </Picker>
  );
}

function Form({onValueChange}: Pick<PickerProps, 'onValueChange'>) {
  const [state, setState] = useState({language: 'en', theme: 'system', refresh: 15});
  const update = (key: keyof typeof state) => (value: string | number) => {
    setState(s => ({...s, [key]: value}));
    onValueChange?.(value);
  };
  return (
    <Column modifiers={fillWidth} spacing={16}>
      <Picker label="Language" selectedValue={state.language} onValueChange={update('language')}>
        <Picker.Item label="English" value="en"/>
        <Picker.Item label="Español" value="es"/>
        <Picker.Item label="Français" value="fr"/>
        <Picker.Item label="日本語" value="ja"/>
      </Picker>
      <Picker label="Appearance" selectedValue={state.theme} onValueChange={update('theme')}>
        <Picker.Item label="System" value="system"/>
        <Picker.Item label="Light" value="light"/>
        <Picker.Item label="Dark" value="dark"/>
      </Picker>
      <Picker label="Refresh every" selectedValue={state.refresh} onValueChange={update('refresh')}>
        <Picker.Item label="5 minutes" value={5}/>
        <Picker.Item label="15 minutes" value={15}/>
        <Picker.Item label="1 hour" value={60}/>
      </Picker>
    </Column>
  );
}

const items = [
  <Picker.Item key="s" label="Small" value="s"/>,
  <Picker.Item key="m" label="Medium" value="m"/>,
  <Picker.Item key="l" label="Large" value="l"/>,
  <Picker.Item key="xl" label="Extra large" value="xl"/>,
];

const meta = {
  title: 'Components/Picker',
  component: Picker,
  parameters: {docs: {description: {component: 'Dropdown that selects one option from a list. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    label: 'Size',
    selectedValue: 'm',
    disabled: false,
    onValueChange: fn(),
    children: items,
  },
  argTypes: {
    accentColor: {control: 'color'},
    selectedValue: {control: 'select', options: ['s', 'm', 'l', 'xl']},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof Picker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Uncontrolled: Story = {
  render: args => (
    <Picker label={args.label} onValueChange={args.onValueChange}>
      {items}
    </Picker>
  ),
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const CustomAccent: Story = {
  args: {accentColor: '#FF9500'},
};

export const NoLabel: Story = {
  args: {label: undefined},
};

export const NumericValues: Story = {
  args: {
    label: 'Refresh every',
    selectedValue: 15,
    children: [
      <Picker.Item key={5} label="5 minutes" value={5}/>,
      <Picker.Item key={15} label="15 minutes" value={15}/>,
      <Picker.Item key={60} label="1 hour" value={60}/>,
    ],
  },
};

export const LongLabels: Story = {
  args: {
    label: 'Time zone',
    selectedValue: 'pst',
    children: [
      <Picker.Item key="pst" label="Pacific Standard Time (UTC−8)" value="pst"/>,
      <Picker.Item key="est" label="Eastern Standard Time (UTC−5)" value="est"/>,
      <Picker.Item key="cet" label="Central European Time (UTC+1)" value="cet"/>,
    ],
  },
};

export const SettingsForm: Story = {
  render: args => <Form onValueChange={args.onValueChange}/>,
};

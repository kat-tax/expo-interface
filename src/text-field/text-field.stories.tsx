import type {Meta, StoryObj} from '@storybook/react-native';
import type {TextFieldProps} from './types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column} from '@expo/ui';
import {fillWidth} from '../fill';
import {FieldGroup} from '../field-group';
import {TextField} from '.';

/** Keeps the controlled field editable while still reporting to the action log. */
function Controlled({value, onChangeText, ...props}: TextFieldProps) {
  const [text, setText] = useState(value ?? '');
  return (
    <TextField
      {...props}
      value={text}
      onChangeText={next => {
        setText(next);
        onChangeText?.(next);
      }}
    />
  );
}

function SignUp({onChangeText, onSubmit}: Pick<TextFieldProps, 'onChangeText' | 'onSubmit'>) {
  const [form, setForm] = useState({name: '', email: '', phone: '', password: ''});
  const update = (key: keyof typeof form) => (text: string) => {
    setForm(f => ({...f, [key]: text}));
    onChangeText?.(text);
  };
  return (
    <FieldGroup>
      <FieldGroup.Section title="Account">
        <TextField placeholder="Name" value={form.name} autoCapitalize="words" onChangeText={update('name')}/>
        <TextField
          placeholder="Email"
          value={form.email}
          keyboardType="email"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={update('email')}
        />
        <TextField placeholder="Phone" value={form.phone} keyboardType="phone" onChangeText={update('phone')}/>
      </FieldGroup.Section>
      <FieldGroup.Section title="Security">
        <TextField
          placeholder="Password"
          value={form.password}
          secureTextEntry
          onChangeText={update('password')}
          onSubmit={onSubmit}
        />
      </FieldGroup.Section>
    </FieldGroup>
  );
}

const meta = {
  title: 'Components/TextField',
  component: TextField,
  parameters: {docs: {description: {component: 'Single or multiline text input with keyboard type, capitalization and secure entry. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    placeholder: 'Name',
    value: '',
    disabled: false,
    secureTextEntry: false,
    multiline: false,
    onChangeText: fn(),
    onSubmit: fn(),
  },
  argTypes: {
    keyboardType: {control: 'select', options: ['default', 'email', 'number', 'phone', 'decimal', 'url']},
    autoCapitalize: {control: 'select', options: ['none', 'sentences', 'words', 'characters']},
    accentColor: {control: 'color'},
  },
  render: args => <Controlled {...args}/>,
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithValue: Story = {
  args: {value: 'Ada Lovelace'},
};

export const Email: Story = {
  args: {placeholder: 'Email', keyboardType: 'email', autoCapitalize: 'none', autoCorrect: false},
};

export const Secure: Story = {
  args: {placeholder: 'Password', secureTextEntry: true},
};

export const Multiline: Story = {
  args: {placeholder: 'Notes', multiline: true, value: 'First line\nSecond line'},
};

export const Disabled: Story = {
  args: {value: 'Read only', disabled: true},
};

export const MaxLength: Story = {
  args: {placeholder: 'Code (6 digits)', keyboardType: 'number', maxLength: 6},
};

export const CustomAccent: Story = {
  args: {placeholder: 'Search', accentColor: '#FF9500'},
};

export const Uncontrolled: Story = {
  render: args => <TextField placeholder="Type freely" onChangeText={args.onChangeText}/>,
};

export const KeyboardTypes: Story = {
  render: args => (
    <Column modifiers={fillWidth} spacing={12}>
      <Controlled {...args} placeholder="Default"/>
      <Controlled {...args} placeholder="Email" keyboardType="email" autoCapitalize="none"/>
      <Controlled {...args} placeholder="Number" keyboardType="number"/>
      <Controlled {...args} placeholder="Phone" keyboardType="phone"/>
      <Controlled {...args} placeholder="Decimal" keyboardType="decimal"/>
      <Controlled {...args} placeholder="URL" keyboardType="url" autoCapitalize="none"/>
    </Column>
  ),
};

export const SignUpForm: Story = {
  render: args => <SignUp onChangeText={args.onChangeText} onSubmit={args.onSubmit}/>,
};

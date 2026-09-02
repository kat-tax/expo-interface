import type {Meta, StoryObj} from '@storybook/react-native';
import type {FieldGroupProps} from '@expo/ui';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Text} from '@expo/ui';
import {Button} from '../button';
import {ListItem} from '../list-item';
import {Switch} from '../switch';
import {TextField} from '../text-field';
import {Footnote} from '../typography';
import * as icons from '../__stories__/icons';
import {FieldGroup} from '.';

/** A settings screen assembled from the kit's row components. */
function Settings({onPress, ...props}: FieldGroupProps & {onPress: () => void}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState({wifi: true, bluetooth: false});
  const toggle = (key: keyof typeof state) => (value: boolean) => setState(s => ({...s, [key]: value}));
  return (
    <FieldGroup {...props}>
      <FieldGroup.Section title="Profile">
        <TextField value={name} placeholder="Name" onChangeText={setName}/>
        <TextField
          value={email}
          placeholder="Email"
          keyboardType="email"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setEmail}
        />
      </FieldGroup.Section>
      <FieldGroup.Section title="Connectivity">
        <Switch label="Wi-Fi" value={state.wifi} onValueChange={toggle('wifi')}/>
        <Switch label="Bluetooth" value={state.bluetooth} onValueChange={toggle('bluetooth')}/>
      </FieldGroup.Section>
      <FieldGroup.Section title="Account">
        <ListItem supporting="Drops, files and settings" onPress={onPress}>Export data</ListItem>
        <Button label="Delete account" variant="text" role="destructive" prefixIcon={icons.trash} onPress={onPress}/>
      </FieldGroup.Section>
    </FieldGroup>
  );
}

const meta = {
  title: 'Components/FieldGroup',
  component: FieldGroup,
  parameters: {docs: {description: {component: 'Scrollable settings form made of titled sections of rows. Renders the platform control: SwiftUI on iOS, Jetpack Compose on Android and a DOM element on web.'}}},
  args: {
    hidden: false,
    onPress: fn(),
  },
  render: args => <Settings {...args}/>,
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsForm: Story = {};

export const TitledSections: Story = {
  render: args => (
    <FieldGroup {...args}>
      <FieldGroup.Section title="General">
        <ListItem onPress={args.onPress}>Appearance</ListItem>
        <ListItem onPress={args.onPress}>Notifications</ListItem>
        <ListItem onPress={args.onPress}>Privacy</ListItem>
      </FieldGroup.Section>
      <FieldGroup.Section title="Support" titleUppercase>
        <ListItem onPress={args.onPress}>Help center</ListItem>
        <ListItem onPress={args.onPress}>Contact us</ListItem>
      </FieldGroup.Section>
    </FieldGroup>
  ),
};

export const CustomHeaderFooter: Story = {
  render: args => (
    <FieldGroup {...args}>
      <FieldGroup.Section>
        <FieldGroup.SectionHeader>
          <Text textStyle={{fontSize: 20, fontWeight: '600'}}>Storage</Text>
        </FieldGroup.SectionHeader>
        <ListItem supporting="12.4 GB used" onPress={args.onPress}>Drops</ListItem>
        <ListItem supporting="1.1 GB used" onPress={args.onPress}>Cache</ListItem>
        <FieldGroup.SectionFooter>
          <Footnote color="secondaryLabel">Clearing the cache does not delete your drops.</Footnote>
        </FieldGroup.SectionFooter>
      </FieldGroup.Section>
    </FieldGroup>
  ),
};

export const ImplicitSection: Story = {
  render: args => (
    <FieldGroup {...args}>
      <ListItem onPress={args.onPress}>Rows outside a Section</ListItem>
      <ListItem onPress={args.onPress}>are grouped automatically</ListItem>
    </FieldGroup>
  ),
};

export const Hidden: Story = {
  args: {hidden: true},
};

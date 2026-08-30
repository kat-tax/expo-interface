import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Body, Title} from '../typography';
import {FieldGroup} from '../field-group';
import {Switch} from '../switch';
import {ScreenHeader} from './header';
import {Screen} from '.';

/** Plain React Native content for the default (non-native) screen. */
function Article() {
  return (
    <View style={styles.article}>
      <Title>Welcome</Title>
      <Body color="secondaryLabel">
        A plain React Native screen. The content box is centered and capped at
        the kit&apos;s content width; toggle the gutter control to add
        horizontal padding.
      </Body>
    </View>
  );
}

/** @expo/ui content for the `native` screen, which mounts its own accent-seeded Host. */
function Settings() {
  const [state, setState] = useState({wifi: true, bluetooth: false, airplane: false});
  const toggle = (key: keyof typeof state) => (value: boolean) => setState(s => ({...s, [key]: value}));
  return (
    <FieldGroup>
      <FieldGroup.Section title="Connectivity">
        <Switch label="Wi-Fi" value={state.wifi} onValueChange={toggle('wifi')}/>
        <Switch label="Bluetooth" value={state.bluetooth} onValueChange={toggle('bluetooth')}/>
        <Switch label="Airplane mode" value={state.airplane} onValueChange={toggle('airplane')}/>
      </FieldGroup.Section>
    </FieldGroup>
  );
}

const meta = {
  title: 'Layout/Screen',
  component: Screen,
  // `Screen` mounts the `@expo/ui` Host itself; keep the global decorator's out.
  parameters: {native: false},
  args: {
    native: false,
    header: false,
    gutter: false,
  },
  render: args => (
    <Screen {...args}>
      <Article/>
    </Screen>
  ),
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const Gutter: Story = {
  args: {gutter: true},
};

export const UnderHeader: Story = {
  args: {header: true, gutter: true},
  render: args => (
    <View style={styles.fill}>
      <ScreenHeader title="Article" onBack={fn()}/>
      <Screen {...args}>
        <Article/>
      </Screen>
    </View>
  ),
};

export const Native: Story = {
  args: {native: true},
  render: args => (
    <Screen {...args}>
      <Settings/>
    </Screen>
  ),
};

export const NativeUnderHeader: Story = {
  args: {native: true, header: true},
  render: args => (
    <View style={styles.fill}>
      <ScreenHeader title="Settings" onBack={fn()}/>
      <Screen {...args}>
        <Settings/>
      </Screen>
    </View>
  ),
};

const styles = StyleSheet.create({
  fill: {flex: 1},
  article: {gap: 8},
});

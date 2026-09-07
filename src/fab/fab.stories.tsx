import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {StyleSheet, View} from 'react-native';
import {Body, Title} from '../typography';
import {Screen} from '../screen';
import * as icons from '../__stories__/icons';
import {Fab} from '.';

const meta = {
  title: 'Components/Fab',
  component: Fab,
  // The button floats in its own accent-seeded host; keep the decorator's out.
  parameters: {docs: {description: {component: 'Floating action button: the screen\'s primary action, placed by `Screen`\'s `fab` slot. Material 3 on Android, drawn in SwiftUI on iOS, a DOM button on web; with `items` it opens the kit\'s menu.'}}, native: false},
  args: {
    label: 'New',
    icon: icons.add,
    size: 'regular',
    disabled: false,
    onPress: fn(),
  },
  argTypes: {
    size: {control: 'select', options: ['small', 'regular', 'large', 'extended']},
  },
  render: args => (
    <View style={styles.row}>
      <Fab {...args}/>
    </View>
  ),
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Regular: Story = {};

export const Small: Story = {
  args: {size: 'small'},
};

export const Large: Story = {
  args: {size: 'large'},
};

export const Extended: Story = {
  args: {size: 'extended', label: 'New document'},
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const WithMenu: Story = {
  args: {
    items: [
      {label: 'Blank document', icon: icons.add, onPress: fn()},
      {label: 'Import files…', icon: icons.share, onPress: fn()},
      {label: 'Open by id…', icon: icons.info, separator: true, onPress: fn()},
    ],
  },
};

export const OnScreen: Story = {
  render: args => (
    <Screen header gutter fab={<Fab {...args}/>}>
      <View style={styles.article}>
        <Title>Documents</Title>
        <Body color="secondaryLabel">
          The screen places the button at its bottom trailing corner, above the
          safe-area inset, fixed to the viewport on web.
        </Body>
      </View>
    </Screen>
  ),
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 16, padding: 8},
  article: {gap: 8},
});

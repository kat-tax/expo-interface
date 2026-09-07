import type {Meta, StoryObj} from '@storybook/react-native';
import {StyleSheet, View} from 'react-native';
import {Body, Footnote, Headline} from '../typography';
import {Surface} from '.';

const meta = {
  title: 'Layout/Surface',
  component: Surface,
  // A surface is React Native on every platform: it holds what is not native.
  parameters: {native: false, docs: {description: {component: 'A box in the theme\'s own colors — the bar under a canvas, a strip of floating tools, a card, a drop target. The one kit component drawn in React Native everywhere, because what it holds (a canvas, a preview, a `NativeHost`) cannot live in a native box.'}}},
  args: {
    color: 'element',
    border: 'none',
    radius: 12,
    raised: false,
    dashed: false,
    padding: 16,
  },
  argTypes: {
    color: {control: 'select', options: ['background', 'element', 'selected', 'none']},
    border: {control: 'select', options: ['none', 'all', 'top', 'bottom']},
    radius: {control: 'number'},
    padding: {control: 'number'},
    borderColor: {control: 'color'},
  },
  render: args => (
    <Surface {...args}>
      <Headline color="label">Holiday photos</Headline>
      <Footnote color="secondaryLabel">Edited yesterday</Footnote>
    </Surface>
  ),
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Element: Story = {};

export const Bordered: Story = {
  args: {border: 'all'},
};

export const Raised: Story = {
  args: {raised: true, border: 'all'},
};

export const Bar: Story = {
  args: {color: 'background', border: 'top', radius: 0},
  render: args => (
    <Surface {...args}>
      <Body color="secondaryLabel">A bar along the bottom of a canvas</Body>
    </Surface>
  ),
};

export const DropTarget: Story = {
  args: {border: 'all', dashed: true, borderColor: '#007AFF', padding: 32},
  render: args => (
    <Surface {...args}>
      <Body color="secondaryLabel">Drop files here</Body>
    </Surface>
  ),
};

export const Pressable: Story = {
  args: {border: 'all', label: 'Holiday photos'},
  render: args => (
    <View style={styles.stack}>
      <Surface {...args} onPress={() => {}}>
        <Headline color="label">Holiday photos</Headline>
        <Footnote color="secondaryLabel">Tap the surface</Footnote>
      </Surface>
    </View>
  ),
};

const styles = StyleSheet.create({
  stack: {gap: 12},
});

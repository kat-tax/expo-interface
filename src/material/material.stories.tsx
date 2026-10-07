import type {Meta, StoryObj} from '@storybook/react-native';
import {StyleSheet, View} from 'react-native';
import {Footnote, Headline} from '../typography';
import {Material} from '.';

const SWATCHES = ['#FF9500', '#34C759', '#007AFF', '#AF52DE', '#FF2D55'];

const meta = {
  title: 'Layout/Material',
  component: Material,
  // A material is a React Native view on every platform, with its children on top.
  parameters: {native: false, docs: {description: {component: 'A view on the platform\'s material with its children on top: the system material or Liquid Glass on iOS, a blur of what passes under on web, acrylic on Windows, and an opaque fill on Android.'}}},
  args: {
    kind: 'regular',
    fill: 'background',
    edge: 'none',
    radius: 16,
  },
  argTypes: {
    kind: {control: 'select', options: ['thin', 'regular', 'thick', 'glass']},
    fill: {control: 'select', options: ['background', 'element']},
    edge: {control: 'select', options: ['none', 'all', 'top', 'bottom']},
    radius: {control: 'number'},
  },
  render: args => (
    <View style={styles.stage}>
      <View style={styles.swatches}>
        {SWATCHES.map(color => <View key={color} style={[styles.swatch, {backgroundColor: color}]}/>)}
      </View>
      <Material {...args} style={styles.panel}>
        <Headline color="label">Over the content</Headline>
        <Footnote color="secondaryLabel">What passes under shows through</Footnote>
      </Material>
    </View>
  ),
} satisfies Meta<typeof Material>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Regular: Story = {};

export const Thin: Story = {
  args: {kind: 'thin', edge: 'all'},
};

export const Glass: Story = {
  args: {kind: 'glass', radius: 24},
};

export const Bar: Story = {
  args: {kind: 'thick', edge: 'bottom', radius: 0},
};

const styles = StyleSheet.create({
  stage: {
    height: 160,
    justifyContent: 'center',
  },
  swatches: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
  },
  swatch: {
    flex: 1,
  },
  panel: {
    marginHorizontal: 24,
    padding: 16,
    gap: 4,
  },
});

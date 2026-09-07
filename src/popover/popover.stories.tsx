import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {StyleSheet, View} from 'react-native';
import {Footnote} from '../typography';
import {Popover} from '.';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {native: false, docs: {description: {component: 'A card pointing at something on a canvas: a spelling suggestion, a note on a block. Kept inside its parent, flipping above the rectangle when there is no room below.'}}},
  args: {
    at: {x: 24, y: 24, width: 80, height: 20},
    title: 'Spelling',
    message: '“teh” is not a word.',
    width: 280,
    onDismiss: fn(),
  },
  render: args => (
    <View style={styles.canvas}>
      <Footnote color="tertiaryLabel">A canvas the kit did not draw</Footnote>
      <Popover {...args}/>
    </View>
  ),
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Note: Story = {};

export const WithActions: Story = {
  args: {
    actions: [
      {label: 'Fix', onPress: fn()},
      {label: 'Ignore', onPress: fn(), role: 'destructive'},
    ],
  },
};

export const NearTheBottom: Story = {
  args: {at: {x: 120, y: 190, width: 60, height: 20}},
};

const styles = StyleSheet.create({
  canvas: {height: 260, padding: 12},
});

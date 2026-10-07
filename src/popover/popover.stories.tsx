import type {Meta, StoryObj} from '@storybook/react-native';
import {useState} from 'react';
import {fn} from 'storybook/test';
import {StyleSheet, View} from 'react-native';
import {Footnote} from '../typography';
import {Popover} from '.';

const meta = {
  title: 'Overlays/Popover',
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

/**
 * An option's editor: a modal card takes the presses around it as its
 * backdrop, so nothing under it is pressed by mistake, and keeps clear of
 * a header over the canvas.
 */
export const Modal: Story = {
  args: {
    title: 'Status',
    message: 'Pick what the column shows.',
    modal: true,
    insets: {top: 40},
    actions: [{label: 'Done', onPress: fn()}],
  },
};

/** A word under the pointer, which a hover card is about. */
function HoverWord({onDismiss}: {onDismiss?: () => void}) {
  const [at, setAt] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  return (
    <View style={styles.canvas}>
      <View
        style={styles.word}
        onPointerEnter={() => setAt({x: 12, y: 12, width: 60, height: 20})}
        onPointerLeave={() => setAt(null)}>
        <Footnote color="label">teh</Footnote>
      </View>
      <Popover at={at} title="Spelling" message="Did you mean “the”?" trigger="hover" onDismiss={onDismiss}/>
    </View>
  );
}

/**
 * A card about the word under the pointer: it lingers once the pointer
 * leaves the word, so the pointer can cross onto it, and goes once the
 * pointer has been away from both for the grace.
 */
export const Hover: Story = {
  render: args => <HoverWord onDismiss={args.onDismiss}/>,
};

const styles = StyleSheet.create({
  canvas: {height: 260, padding: 12},
  word: {alignSelf: 'flex-start', paddingHorizontal: 4},
});

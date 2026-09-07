import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Footnote} from '../typography';
import * as icons from '../__stories__/icons';
import {PopupMenu} from '.';

const items = [
  {label: 'Heading', icon: icons.add},
  {label: 'Bullet list', icon: icons.chevron},
  {label: 'Delete block', icon: icons.trash, role: 'destructive' as const, separator: true},
];

const meta = {
  title: 'Components/PopupMenu',
  component: PopupMenu,
  // The menu lays a host of its own over the content.
  parameters: {native: false, docs: {description: {component: 'The platform\'s menu opened at a point over content the kit did not draw — a right click on a canvas, the caret in an editor. A SwiftUI popover on iOS, a Compose `DropdownMenu` on Android, the `popover` element on web.'}}},
  args: {
    items,
    at: {x: 24, y: 24},
    onDismiss: fn(),
  },
  render: args => (
    <View style={styles.canvas}>
      <Footnote color="tertiaryLabel">A canvas the kit did not draw</Footnote>
      <PopupMenu {...args}/>
    </View>
  ),
} satisfies Meta<typeof PopupMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtAPoint: Story = {};

export const Filtered: Story = {
  args: {filter: 'list'},
};

export const Interactive: Story = {
  render: function Interactive(args) {
    const [at, setAt] = useState<{x: number; y: number} | null>(null);
    return (
      <View style={styles.canvas}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the menu where you press"
          style={StyleSheet.absoluteFill}
          onPress={event => setAt({x: event.nativeEvent.locationX, y: event.nativeEvent.locationY})}
        />
        <Footnote color="tertiaryLabel">Press anywhere in the canvas</Footnote>
        <PopupMenu {...args} at={at} onDismiss={() => setAt(null)}/>
      </View>
    );
  },
};

const styles = StyleSheet.create({
  canvas: {height: 200, padding: 12},
});

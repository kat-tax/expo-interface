import type {Meta, StoryObj} from '@storybook/react-native';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {spacing} from '../theme';
import * as icons from '../__stories__/icons';
import {Chip} from '.';

const meta = {
  title: 'Components/Chip',
  component: Chip,
  parameters: {
    docs: {
      description: {
        component:
          "A capsule that is pressed, and may stay pressed. Android has the only control called a chip and the kit uses three of Material's four; the others have no chip and need none — iOS a SwiftUI `Toggle` in button style, Windows a WinUI `ToggleButton` with a pill radius, web a `<button>` with `aria-pressed`. Each is the platform's control for a thing that is on or off, which is what carries the state to a screen reader.",
      },
    },
  },
  args: {
    label: 'Unread',
    onPress: fn(),
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No state at all: a chip that does something rather than one that is something. */
export const Action: Story = {args: {label: 'Add tag', icon: icons.add}};

export const Selected: Story = {args: {selected: true}};

export const Unselected: Story = {args: {selected: false}};

export const Disabled: Story = {args: {selected: true, disabled: true}};

/** What chips are actually for: a row of filters over a list. */
export const Filters: Story = {
  render: function Filters() {
    const [on, setOn] = useState<Record<string, boolean>>({Unread: true});
    return (
      <View style={styles.row}>
        {['Unread', 'Starred', 'Shared', 'Archived'].map(label => (
          <Chip
            key={label}
            label={label}
            selected={on[label] ?? false}
            testID={`chip-${label.toLowerCase()}`}
            onPress={next => setOn(state => ({...state, [label]: next}))}
          />
        ))}
      </View>
    );
  },
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.two,
  },
});

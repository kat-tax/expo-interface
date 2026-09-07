import type {Meta, StoryObj} from '@storybook/react-native';
import {StyleSheet, View} from 'react-native';
import {Avatar} from '.';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  // A picture in a React Native row, like `Surface`.
  parameters: {native: false, docs: {description: {component: 'A person as a colored circle with their initials: the peers on a document, the members of a space. The circle is hashed from the name unless a color is given.'}}},
  args: {
    name: 'Ada Lovelace',
    size: 28,
  },
  argTypes: {
    color: {control: 'color'},
    size: {control: {type: 'range', min: 16, max: 96, step: 4}},
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const Colored: Story = {
  args: {color: '#8959EA'},
};

export const Large: Story = {
  args: {size: 64},
};

export const Peers: Story = {
  render: () => (
    <View style={styles.row}>
      {['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Barbara Liskov'].map(name => (
        <Avatar key={name} name={name}/>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8, alignItems: 'center'},
});

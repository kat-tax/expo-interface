import type {Meta, StoryObj} from '@storybook/react-native';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Avatar, AvatarGroup} from '.';

/** The peers on a document, one of whom the view cannot be taken to. */
const PEERS = [
  {name: 'Ada Lovelace', place: 'Notes', reachable: true},
  {name: 'Grace Hopper', place: 'Archive', reachable: false},
  {name: 'Alan Turing', place: 'Drafts', reachable: true},
];

/** A facepile that follows the peer pressed: the followed face is selected and ringed in the tint. */
function Following() {
  const [following, setFollowing] = useState('Ada Lovelace');
  return (
    <AvatarGroup
      size={32}
      people={PEERS.map(peer => ({
        name: peer.name,
        label: `Follow ${peer.name.split(' ')[0]}, on ${peer.place}`,
        hint: 'Hold to go there once, without following',
        selected: peer.name === following,
        ring: peer.name === following ? 'tint' : undefined,
        disabled: !peer.reachable,
      }))}
      onPress={peer => setFollowing(peer.name)}
      onLongPress={() => {}}
    />
  );
}

const meta = {
  title: 'Indicators/Avatar',
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

export const Facepile: Story = {
  render: () => <Following/>,
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8, alignItems: 'center'},
});

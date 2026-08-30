import type {Meta, StoryObj} from '@storybook/react-native';
import type {ContextMenuProps} from '../menu/types';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {Column, Text} from '@expo/ui';
import {fillWidth} from '../fill';
import * as icons from '../__stories__/icons';
import {Button} from '../button';
import {ListItem} from '../list-item';
import {ContextMenu} from '.';

const DROPS = [
  {id: 'a', name: 'Holiday photos', size: '128 MB'},
  {id: 'b', name: 'Design assets', size: '42 MB'},
  {id: 'c', name: 'Q3 report', size: '3 MB'},
];

function DropList({onPress}: Pick<ContextMenuProps, 'onPress'>) {
  const [drops, setDrops] = useState(DROPS);
  return (
    <Column modifiers={fillWidth}>
      {drops.map(drop => (
        <ContextMenu
          key={drop.id}
          onPress={onPress}
          items={[
            {label: 'Share', icon: icons.share, onPress: fn()},
            {label: 'Delete', icon: icons.trash, role: 'destructive', separator: true, onPress: () => setDrops(d => d.filter(x => x.id !== drop.id))},
          ]}>
          <ListItem supporting={drop.size}>{drop.name}</ListItem>
        </ContextMenu>
      ))}
    </Column>
  );
}

const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  args: {
    disabled: false,
    onPress: fn(),
    items: [
      {label: 'Share', icon: icons.share, onPress: fn()},
      {label: 'Add to favorites', icon: icons.star, onPress: fn()},
      {label: 'Delete', icon: icons.trash, role: 'destructive', separator: true, onPress: fn()},
    ],
    children: <Text>Long-press or right-click me</Text>,
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PlainItems: Story = {
  args: {
    items: [
      {label: 'Copy', onPress: fn()},
      {label: 'Paste', onPress: fn()},
      {label: 'Select all', onPress: fn()},
    ],
  },
};

export const ItemStates: Story = {
  args: {
    items: [
      {label: 'Rename', onPress: fn()},
      {label: 'Duplicate', disabled: true, onPress: fn()},
      {label: 'Delete', role: 'destructive', separator: true, icon: icons.trash, onPress: fn()},
    ],
  },
};

export const Disabled: Story = {
  args: {disabled: true},
};

export const OnButton: Story = {
  render: args => (
    <ContextMenu {...args}>
      <Button label="Options" variant="outlined" prefixIcon={icons.settings} onPress={args.onPress}/>
    </ContextMenu>
  ),
};

export const DropRows: Story = {
  render: args => <DropList onPress={args.onPress}/>,
};

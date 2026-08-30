import type {Drop} from './types';
import {List} from '@expo/ui';
import {DropItem} from './item';

interface DropListProps {
  items: Drop[];
  onSelect?: (drop: Drop) => void;
}

export function DropList({items, onSelect}: DropListProps) {
  return (
    <List>
      {items.map(drop => (
        <DropItem
          key={drop.id}
          drop={drop}
          onPress={() => onSelect?.(drop)}
        />
      ))}
    </List>
  );
}

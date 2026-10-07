import type {Drop} from './types';
import {List} from 'expo-interface';
import {DropItem} from './item';

interface DropListProps {
  items: Drop[];
  onSelect?: (drop: Drop) => void;
}

/** The drops, in the platform's own lazy list: SwiftUI's, Compose's, the DOM's, a windowed FlatList. */
export function DropList({items, onSelect}: DropListProps) {
  return (
    <List
      data={items}
      keyExtractor={drop => drop.id}
      renderItem={drop => <DropItem drop={drop} onPress={() => onSelect?.(drop)}/>}
      testID="drop-list"
    />
  );
}

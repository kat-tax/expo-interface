import type {Drop} from './types';

import {Text} from '@expo/ui';
import {SymbolView} from 'expo-symbols';
import {ListItem} from '@/ui/list-item';
import {useColor} from '@/ui/theme';
import * as icon from '@/ui/icons';

import {DropIcon} from './icon';

export interface DropItemProps {
  drop: Drop;
  onPress?: () => void;
}

export function DropItem({drop, onPress}: DropItemProps) {
  const label = useColor('label');
  const chevron = useColor('tertiaryLabel');
  const count = `${drop.files.length} ${drop.files.length === 1 ? 'file' : 'files'}`;
  return (
    <ListItem
      onPress={onPress}
      leading={<DropIcon size={32}/>}
      supporting={`${count} · ${drop.size}`}
      trailing={<SymbolView name={icon.chevronRight.symbol} size={14} tintColor={chevron}/>}>
      <Text textStyle={{color: label}}>{drop.name}</Text>
    </ListItem>
  );
}

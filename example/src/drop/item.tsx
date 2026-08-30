import type {Drop} from './types';

import {Text} from '@expo/ui';
import {SymbolView} from 'expo-symbols';
import {ContextMenu, ListItem, useColor} from 'expo-interface';
import * as icon from '@/icons';

import {DropIcon} from './icon';

export interface DropItemProps {
  drop: Drop;
  onPress?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export function DropItem({drop, onPress, onShare, onDelete}: DropItemProps) {
  const label = useColor('label');
  const chevron = useColor('tertiaryLabel');
  const count = `${drop.files.length} ${drop.files.length === 1 ? 'file' : 'files'}`;
  return (
    <ContextMenu
      onPress={onPress}
      items={[
        {label: 'Share', icon: icon.share, onPress: onShare},
        {label: 'Delete', icon: icon.trash, role: 'destructive', separator: true, onPress: onDelete},
      ]}>
      <ListItem
        leading={<DropIcon size={32}/>}
        supporting={`${count} · ${drop.size}`}
        trailing={<SymbolView name={icon.chevronRight.symbol} size={14} tintColor={chevron}/>}>
        <Text textStyle={{color: label}}>{drop.name}</Text>
      </ListItem>
    </ContextMenu>
  );
}

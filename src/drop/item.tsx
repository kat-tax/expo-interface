import type {Drop} from './types';
import {SymbolView} from 'expo-symbols';
import {ListItem, Text} from '@expo/ui';
import {ICON_CHEVRON_RIGHT} from '@/ui/icons';
import {useColor} from '@/ui/theme';
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
    <ListItem onPress={() => onPress?.()}>
      <ListItem.Leading>
        <DropIcon size={32}/>
      </ListItem.Leading>
      <Text textStyle={{color: label}}>{drop.name}</Text>
      <ListItem.Supporting>
        {`${count} · ${drop.size}`}
      </ListItem.Supporting>
      <ListItem.Trailing>
        <SymbolView name={ICON_CHEVRON_RIGHT.symbol} size={14} tintColor={chevron}/>
      </ListItem.Trailing>
    </ListItem>
  );
}

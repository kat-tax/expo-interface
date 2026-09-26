import type {Drop} from './types';

import {Text} from '@expo/ui';
import {SymbolView} from 'expo-symbols';
import {Badge, ContextMenu, ListItem, useColor} from 'expo-interface';
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
      label={drop.name}
      onPress={onPress}
      items={[
        {label: 'Share', icon: icon.share, onPress: onShare},
        {label: 'Delete', icon: icon.trash, role: 'destructive', separator: true, onPress: onDelete},
      ]}>
      <ListItem
        leading={<DropIcon size={32}/>}
        supporting={`${count} · ${drop.size}`}
        trailing={(
          <>
            {/* The platform's own badge: an InfoBadge on Windows, the Material
                3 Badge on Android, drawn on iOS and a span on web. */}
            <Badge count={drop.files.length} testID={`files-${drop.id}`}/>
            <SymbolView name={icon.chevronRight.symbol} size={14} tintColor={chevron}/>
          </>
        )}>
        <Text textStyle={{color: label}}>{drop.name}</Text>
      </ListItem>
    </ContextMenu>
  );
}

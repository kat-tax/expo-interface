import type {FileType} from '@/types/files';
import {IconFile} from '@/components/icons/files';
import {ListItem, Text} from '@expo/ui';

export interface FileItemProps {
  id: number;
  name: string;
  size: string;
  type: FileType;
}

export function FileItem({name, size, type}: FileItemProps) {
  return (
    <ListItem onPress={() => {}}>
      <ListItem.Leading>
        <IconFile name={type} size={32}/>
      </ListItem.Leading>
      <Text>
        {name}
      </Text>
      <ListItem.Supporting>
        {size}
      </ListItem.Supporting>
    </ListItem>
  );
}

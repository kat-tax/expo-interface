import type {FileType} from '@/types/files';
import {ListItem, Text} from '@expo/ui';
import {FileIcon} from '@/components/native/file-icon';

export interface FileItemProps {
  id: number;
  name: string;
  size: string;
  type: FileType;
  onPress?: () => void;
}

export function FileItem({name, size, type, onPress}: FileItemProps) {
  return (
    <ListItem onPress={() => onPress?.()}>
      <ListItem.Leading>
        <FileIcon name={type} size={32}/>
      </ListItem.Leading>
      <Text>{name}</Text>
      <ListItem.Supporting>{size}</ListItem.Supporting>
    </ListItem>
  );
}

import type {FileType, UploadStatus} from '@/file/types';
import {ListItem, Text} from '@expo/ui';
import {FileIcon} from './icon';
import {useColor} from '@/ui/theme';

export interface FileItemProps {
  id: number;
  name: string;
  size: string;
  type: FileType;
  status?: UploadStatus;
  progress?: number;
  onPress?: () => void;
}

export function FileItem({name, size, type, onPress}: FileItemProps) {
  const label = useColor('label');
  return (
    <ListItem onPress={() => onPress?.()}>
      <ListItem.Leading>
        <FileIcon name={type} size={32}/>
      </ListItem.Leading>
      <Text textStyle={{color: label}}>{name}</Text>
      <ListItem.Supporting>
        {size}
      </ListItem.Supporting>
    </ListItem>
  );
}

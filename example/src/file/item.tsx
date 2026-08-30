import type {FileType, UploadStatus} from '@/file/types';

import {Text} from '@expo/ui';
import {useColor, ListItem} from 'expo-interface';
import {FileIcon} from './icon';

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
    <ListItem
      onPress={onPress}
      leading={<FileIcon name={type} size={32}/>}
      supporting={size}>
      <Text textStyle={{color: label}}>{name}</Text>
    </ListItem>
  );
}

import type {FileItemProps} from '@/components/native/file-item';

import {List} from '@expo/ui';
import {FileItem} from '@/components/native/file-item';

interface FileListProps {
  items: FileItemProps[];
}

export function FileList({items}: FileListProps) {
  return (
    <List>
      {items.map(item => (
        <FileItem key={item.id} {...item}/>
      ))}
    </List>
  );
}

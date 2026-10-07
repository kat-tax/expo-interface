import type {FileType} from '@/file/types';

import {Icon} from 'expo-interface';
import * as icon from '@/icons';

export interface FileIconProps {
  name: FileType;
  size?: number;
}
export function FileIcon({name, size = 24}: FileIconProps) {
  let i = icon.fileOther;
  switch (name) {
    case 'image':
      i = icon.fileImage; break;
    case 'video':
      i = icon.fileVideo; break;
    case 'audio':
      i = icon.fileAudio; break;
    case 'text':
      i = icon.fileText; break;
    case 'other':
      i = icon.fileOther; break;
    default: name satisfies never;
  }
  return <Icon icon={i} size={size}/>;
}

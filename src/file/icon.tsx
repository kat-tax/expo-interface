import type {FileType} from '@/file/types';
import {SymbolView} from 'expo-symbols';
import {useColor} from '@/ui/theme';
import * as _ from '@/ui/icons';

export interface FileIconProps {
  name: FileType;
  size?: number;
}
export function FileIcon({name, size = 24}: FileIconProps) {
  const color = useColor('label');
  let icon = _.ICON_FILE_OTHER;
  switch (name) {
    case 'image':
      icon = _.ICON_FILE_IMAGE; break;
    case 'video':
      icon = _.ICON_FILE_VIDEO; break;
    case 'audio':
      icon = _.ICON_FILE_AUDIO; break;
    case 'text':
      icon = _.ICON_FILE_TEXT; break;
    case 'other':
      icon = _.ICON_FILE_OTHER; break;
    default: name satisfies never;
  }
  return (
    <SymbolView
      name={icon}
      size={size}
      tintColor={color}
    />
  );
}

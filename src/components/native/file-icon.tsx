import type {FileType} from '@/types/files';
import {SymbolView} from 'expo-symbols';
import {useTheme} from '@/ui/theme';
import * as _ from '@/ui/icons';

export interface FileIconProps {
  name: FileType;
  size?: number;
}
export function FileIcon({name, size = 24}: FileIconProps) {
  const theme = useTheme();
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
      tintColor={theme.label}
    />
  );
}

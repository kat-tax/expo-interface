import type {FileType} from '@/file/types';
import {SymbolView} from 'expo-symbols';
import {useColor} from '@/ui/theme';
import * as icon from '@/ui/icons';

export interface FileIconProps {
  name: FileType;
  size?: number;
}
export function FileIcon({name, size = 24}: FileIconProps) {
  const color = useColor('label');
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
  return (
    <SymbolView
      name={i.symbol}
      size={size}
      tintColor={color}
    />
  );
}

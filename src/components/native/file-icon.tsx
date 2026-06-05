import type {FileType} from '@/types/files';
import {Icon} from '@expo/ui';

export interface FileIcon {
  name: FileType;
  size?: number;
}

export function FileIcon({name, size = 24}: FileIcon) {
  let icon = ICON_OTHER;
  switch (name) {
    case 'image':
      icon = ICON_IMAGE; break;
    case 'video':
      icon = ICON_VIDEO; break;
    case 'audio':
      icon = ICON_AUDIO; break;
    case 'text':
      icon = ICON_TEXT; break;
    case 'other':
      icon = ICON_OTHER; break;
    default: name satisfies never;
  }
  return (
    <Icon name={icon} size={size}/>
  );
}

export const ICON_IMAGE = Icon.select({
  ios: 'photo',
  android: import('@expo/material-symbols/photo.xml'),
});

export const ICON_VIDEO = Icon.select({
  ios: 'video',
  android: import('@expo/material-symbols/video_file.xml'),
});

export const ICON_AUDIO = Icon.select({
  ios: 'music.note',
  android: import('@expo/material-symbols/audio_file.xml'),
});

export const ICON_TEXT = Icon.select({
  ios: 'doc.text',
  android: import('@expo/material-symbols/description.xml'),
});

export const ICON_OTHER = Icon.select({
  ios: 'doc',
  android: import('@expo/material-symbols/draft.xml'),
});

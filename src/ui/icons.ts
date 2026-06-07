import type {SymbolViewProps} from 'expo-symbols';

export const ICON_FILE_IMAGE: SymbolViewProps['name'] = {
  android: 'photo',
  web: 'photo',
  ios: 'photo',
};

export const ICON_FILE_VIDEO: SymbolViewProps['name'] = {
  android: 'video_file',
  web: 'video_file',
  ios: 'video',
};

export const ICON_FILE_AUDIO: SymbolViewProps['name'] = {
  android: 'audio_file',
  web: 'audio_file',
  ios: 'music.note',
};

export const ICON_FILE_TEXT: SymbolViewProps['name'] = {
  android: 'description',
  web: 'description',
  ios: 'doc.text',
};

export const ICON_FILE_OTHER: SymbolViewProps['name'] = {
  android: 'draft',
  web: 'draft',
  ios: 'doc',
};

import type {ImageSourcePropType} from 'react-native';
import type {SymbolViewProps} from 'expo-symbols';
import {drawables} from './icons.drawables';

export interface IconToken {
  symbol: SymbolViewProps['name'];
  drawable?: ImageSourcePropType;
}

function icon(
  symbol: SymbolViewProps['name'],
  android: string,
): IconToken {
  return {symbol, drawable: drawables[android]};
}

/** UX Icons */

export const ICON_DROP = icon(
  {android: 'inventory_2', web: 'inventory_2', ios: 'shippingbox'},
  'inventory_2',
);

export const ICON_CHEVRON_RIGHT = icon(
  {android: 'chevron_right', web: 'chevron_right', ios: 'chevron.right'},
  'chevron_right',
);

export const ICON_UPLOAD = icon(
  {android: 'cloud_upload', web: 'cloud_upload', ios: 'icloud.and.arrow.up'},
  'cloud_upload',
);

export const ICON_CALENDAR = icon(
  {android: 'calendar_month', web: 'calendar_month', ios: 'calendar'},
  'calendar_month',
);

export const ICON_LIMIT = icon(
  {android: 'description', web: 'description', ios: 'doc.text.magnifyingglass'},
  'description',
);

export const ICON_TRASH = icon(
  {android: 'delete', web: 'delete', ios: 'trash'},
  'delete',
);

export const ICON_COMPLETE = icon(
  {android: 'check_circle', web: 'check_circle', ios: 'checkmark.circle.fill'},
  'check_circle',
);

export const ICON_FAILED = icon(
  {android: 'error', web: 'error', ios: 'xmark.circle.fill'},
  'error',
);

export const ICON_FILES = icon(
  {android: 'note_add', web: 'note_add', ios: 'doc.badge.plus'},
  'note_add',
);

export const ICON_MEDIA = icon(
  {android: 'photo_library', web: 'photo_library', ios: 'photo.on.rectangle'},
  'photo_library',
);

export const ICON_CAMERA = icon(
  {android: 'photo_camera', web: 'photo_camera', ios: 'camera'},
  'photo_camera',
);

export const ICON_RETRY = icon(
  {android: 'refresh', web: 'refresh', ios: 'arrow.clockwise'},
  'refresh',
);

/** File Icons */

export const ICON_FILE_IMAGE = icon(
  {android: 'photo', web: 'photo', ios: 'photo'},
  'photo',
);

export const ICON_FILE_VIDEO = icon(
  {android: 'video_file', web: 'video_file', ios: 'video'},
  'video_file',
);

export const ICON_FILE_AUDIO = icon(
  {android: 'audio_file', web: 'audio_file', ios: 'music.note'},
  'audio_file',
);

export const ICON_FILE_TEXT = icon(
  {android: 'description', web: 'description', ios: 'doc.text'},
  'description',
);

export const ICON_FILE_OTHER = icon(
  {android: 'draft', web: 'draft', ios: 'doc'},
  'draft',
);

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

export const drop = icon(
  {android: 'inventory_2', web: 'inventory_2', ios: 'shippingbox'},
  'inventory_2',
);

export const chevronRight = icon(
  {android: 'chevron_right', web: 'chevron_right', ios: 'chevron.right'},
  'chevron_right',
);

export const upload = icon(
  {android: 'cloud_upload', web: 'cloud_upload', ios: 'icloud.and.arrow.up'},
  'cloud_upload',
);

export const calendar = icon(
  {android: 'calendar_month', web: 'calendar_month', ios: 'calendar'},
  'calendar_month',
);

export const limit = icon(
  {android: 'description', web: 'description', ios: 'doc.text.magnifyingglass'},
  'description',
);

export const trash = icon(
  {android: 'delete', web: 'delete', ios: 'trash'},
  'delete',
);

export const complete = icon(
  {android: 'check_circle', web: 'check_circle', ios: 'checkmark.circle.fill'},
  'check_circle',
);

export const failed = icon(
  {android: 'error', web: 'error', ios: 'xmark.circle.fill'},
  'error',
);

export const files = icon(
  {android: 'note_add', web: 'note_add', ios: 'doc.badge.plus'},
  'note_add',
);

export const media = icon(
  {android: 'photo_library', web: 'photo_library', ios: 'photo.on.rectangle'},
  'photo_library',
);

export const camera = icon(
  {android: 'photo_camera', web: 'photo_camera', ios: 'camera'},
  'photo_camera',
);

export const retry = icon(
  {android: 'refresh', web: 'refresh', ios: 'arrow.clockwise'},
  'refresh',
);

/** File Icons */

export const fileImage = icon(
  {android: 'photo', web: 'photo', ios: 'photo'},
  'photo',
);

export const fileVideo = icon(
  {android: 'video_file', web: 'video_file', ios: 'video'},
  'video_file',
);

export const fileAudio = icon(
  {android: 'audio_file', web: 'audio_file', ios: 'music.note'},
  'audio_file',
);

export const fileText = icon(
  {android: 'description', web: 'description', ios: 'doc.text'},
  'description',
);

export const fileOther = icon(
  {android: 'draft', web: 'draft', ios: 'doc'},
  'draft',
);

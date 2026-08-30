import {icon} from 'expo-interface';
import {drawables} from './icons.drawables';

export type {IconToken} from 'expo-interface';

/** UX Icons */

export const drop = icon(
  {android: 'inventory_2', web: 'inventory_2', ios: 'shippingbox'},
  drawables.inventory_2,
);

export const chevronRight = icon(
  {android: 'chevron_right', web: 'chevron_right', ios: 'chevron.right'},
  drawables.chevron_right,
);

export const upload = icon(
  {android: 'cloud_upload', web: 'cloud_upload', ios: 'icloud.and.arrow.up'},
  drawables.cloud_upload,
);

export const calendar = icon(
  {android: 'calendar_month', web: 'calendar_month', ios: 'calendar'},
  drawables.calendar_month,
);

export const limit = icon(
  {android: 'description', web: 'description', ios: 'doc.text.magnifyingglass'},
  drawables.description,
);

export const trash = icon(
  {android: 'delete', web: 'delete', ios: 'trash'},
  drawables.delete,
);

export const complete = icon(
  {android: 'check_circle', web: 'check_circle', ios: 'checkmark.circle.fill'},
  drawables.check_circle,
);

export const failed = icon(
  {android: 'error', web: 'error', ios: 'xmark.circle.fill'},
  drawables.error,
);

export const share = icon(
  {android: 'share', web: 'share', ios: 'square.and.arrow.up'},
  drawables.share,
);

export const edit = icon(
  {android: 'settings', web: 'settings', ios: 'gearshape'},
  drawables.settings,
);

export const media = icon(
  {android: 'photo_library', web: 'photo_library', ios: 'photo.on.rectangle'},
  drawables.photo_library,
);

export const camera = icon(
  {android: 'photo_camera', web: 'photo_camera', ios: 'camera'},
  drawables.photo_camera,
);

export const retry = icon(
  {android: 'refresh', web: 'refresh', ios: 'arrow.clockwise'},
  drawables.refresh,
);

/** File Icons */

export const fileAdd = icon(
  {android: 'note_add', web: 'note_add', ios: 'doc.badge.plus'},
  drawables.note_add,
);

export const fileFind = icon(
  {android: 'find_in_page', web: 'find_in_page', ios: 'doc.text.magnifyingglass'},
  drawables.find_in_page,
);

export const fileImage = icon(
  {android: 'photo', web: 'photo', ios: 'photo'},
  drawables.photo,
);

export const fileVideo = icon(
  {android: 'video_file', web: 'video_file', ios: 'video'},
  drawables.video_file,
);

export const fileAudio = icon(
  {android: 'audio_file', web: 'audio_file', ios: 'music.note'},
  drawables.audio_file,
);

export const fileText = icon(
  {android: 'description', web: 'description', ios: 'doc.text'},
  drawables.description,
);

export const fileOther = icon(
  {android: 'draft', web: 'draft', ios: 'doc'},
  drawables.draft,
);

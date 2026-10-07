import {icon, registerDrawables} from 'expo-interface';
import {drawables} from './icons.drawables';

export type {IconToken} from 'expo-interface';

// The Android vectors, once, by their Material names: every token below
// finds its own here, so none lists a drawable.
registerDrawables(drawables);

/** Sections */

export const home = icon({android: 'download', web: 'download', ios: 'arrow.down.square'});

export const settings = icon({android: 'settings', web: 'settings', ios: 'gearshape'});

/** UX Icons */

export const drop = icon({android: 'inventory_2', web: 'inventory_2', ios: 'shippingbox'});

export const chevronRight = icon({android: 'chevron_right', web: 'chevron_right', ios: 'chevron.right'});

export const upload = icon({android: 'cloud_upload', web: 'cloud_upload', ios: 'icloud.and.arrow.up'});

export const calendar = icon({android: 'calendar_month', web: 'calendar_month', ios: 'calendar'});

export const limit = icon({android: 'description', web: 'description', ios: 'doc.text.magnifyingglass'});

export const trash = icon({android: 'delete', web: 'delete', ios: 'trash'});

export const complete = icon({android: 'check_circle', web: 'check_circle', ios: 'checkmark.circle.fill'});

export const failed = icon({android: 'error', web: 'error', ios: 'xmark.circle.fill'});

export const share = icon({android: 'share', web: 'share', ios: 'square.and.arrow.up'});

export const edit = icon({android: 'settings', web: 'settings', ios: 'gearshape'});

export const media = icon({android: 'photo_library', web: 'photo_library', ios: 'photo.on.rectangle'});

export const camera = icon({android: 'photo_camera', web: 'photo_camera', ios: 'camera'});

export const retry = icon({android: 'refresh', web: 'refresh', ios: 'arrow.clockwise'});

/** File Icons */

export const fileAdd = icon({android: 'note_add', web: 'note_add', ios: 'doc.badge.plus'});

export const fileFind = icon({android: 'find_in_page', web: 'find_in_page', ios: 'doc.text.magnifyingglass'});

export const fileImage = icon({android: 'photo', web: 'photo', ios: 'photo'});

export const fileVideo = icon({android: 'video_file', web: 'video_file', ios: 'video'});

export const fileAudio = icon({android: 'audio_file', web: 'audio_file', ios: 'music.note'});

export const fileText = icon({android: 'description', web: 'description', ios: 'doc.text'});

export const fileOther = icon({android: 'draft', web: 'draft', ios: 'doc'});

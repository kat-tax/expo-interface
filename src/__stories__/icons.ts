import {icon} from '../icons';
import {drawables} from './icons.drawables';

/** Icon tokens shared by the stories; Android drawables come from `icons.drawables.android.ts`. */
export const share = icon({ios: 'square.and.arrow.up', android: 'share', web: 'share'}, drawables.share);
export const add = icon({ios: 'plus', android: 'add', web: 'add'}, drawables.add);
export const trash = icon({ios: 'trash', android: 'delete', web: 'delete'}, drawables.delete);
export const chevron = icon({ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right'}, drawables.chevron_right);
export const star = icon({ios: 'star', android: 'star', web: 'star'}, drawables.star);
export const settings = icon({ios: 'gearshape', android: 'settings', web: 'settings'}, drawables.settings);
export const info = icon({ios: 'info.circle', android: 'info', web: 'info'}, drawables.info);

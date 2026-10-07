import {icon} from './icons';

/**
 * The icons the kit's own chrome draws: a sheet's bar, a composer's send
 * button. Each is drawn from what the platform has, and `expo-interface-symbols`
 * writes the Android vectors for every one of them whether or not an app's
 * sources name them.
 */
export const BACK = icon({ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back', windows: 'E72B'});
export const CLOSE = icon({ios: 'xmark', android: 'close', web: 'close', windows: 'E711'});
export const MORE = icon({ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz', windows: 'E712'});
export const SEND = icon({ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward', windows: 'E74A'});
export const STOP = icon({ios: 'stop.fill', android: 'stop', web: 'stop', windows: 'E71A'});

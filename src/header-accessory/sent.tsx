import type {HeaderAccessoryProps} from './types';
import {useHeaderOption} from '../header/option';

/**
 * Web and Windows: the header is drawn by the kit, so the row is too.
 * Rendered in the screen's content, it goes to the route's `headerAccessory`
 * option while it is mounted and comes off when it unmounts, as
 * `HeaderSearch` goes to `headerSearch`: the drawn header puts it under its
 * row, and a web `Tabs` bar that folds the header puts it under the bar, in
 * the bar's material, and counts its height in `useTabBarInset()`.
 */
export function HeaderAccessory({children}: HeaderAccessoryProps) {
  useHeaderOption('headerAccessory', children);
  return null;
}

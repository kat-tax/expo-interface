import {icon} from '../icons';

/** The ellipsis the card's `menu` opens from. */
export const MORE = icon({ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz', windows: 'E712'});

/** The star of `favorite`, outline and filled. */
export const STAR = icon({ios: 'star', android: 'star', web: 'star', windows: 'E734'});
export const STAR_FILLED = icon({ios: 'star', android: 'star', web: 'star', windows: 'E735'}, undefined, {fill: true});

/** What the footer the kit draws leaves clear at its trailing edge for the menu button. */
export const MENU_ROOM = 40;

/** The card's accessible name when the app gives none: its title, and its subtitle after it. */
export function cardName(label: string | undefined, title: string | undefined, subtitle: string | undefined): string | undefined {
  if (label !== undefined) return label;
  if (title === undefined) return undefined;
  return subtitle === undefined ? title : `${title}, ${subtitle}`;
}

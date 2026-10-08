/**
 * The backgrounds the accent's tint is drawn on in each scheme: the screen's
 * and the raised one under cards, menus, dialogs and bars. They are the
 * palette's own values, kept here so the accent can measure its contrast
 * against them without reaching into the theme, which itself reads the
 * accent.
 */

/** The screen's background in each scheme: the palette's `background`. */
export const SCHEME_BACKGROUND = {light: '#ffffff', dark: '#000000'} as const;

/** The raised background in each scheme, under cards, menus, dialogs and bars: the palette's `backgroundElement`. */
export const SCHEME_BACKGROUND_ELEMENT = {light: '#F0F0F3', dark: '#212225'} as const;

/**
 * The screen's background in each scheme: the palette's `background`, kept
 * here so the accent can measure its contrast against it without reaching
 * into the theme, which itself reads the accent.
 */
export const SCHEME_BACKGROUND = {light: '#ffffff', dark: '#000000'} as const;

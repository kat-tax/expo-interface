import type {HighContrast, HighContrastColors} from './contrast-palette';
import {NO_CONTRAST, highContrastPalette} from './contrast-palette';

export type {HighContrast, HighContrastColors};
export {NO_CONTRAST, highContrastPalette};

/**
 * The system's high contrast setting. Windows, on `expo-windows`, reads it
 * and follows the user turning it on or off; the kit's palette then takes
 * the theme's colours (see `highContrastPalette`). Off everywhere else.
 */
export function useHighContrast(): HighContrast {
  return NO_CONTRAST;
}

import type {BadgeProps} from './types';
import {onAccent} from '../accent';
import {hexColor} from '../hex-color';
import {isColorToken, useColor, usePalette} from '../theme';

/** What a badge is drawn in. */
export interface BadgeColors {
  /**
   * The fill: a palette token resolved for the scheme (on web, its CSS
   * variable), the color as given, or the palette's `destructive`.
   */
  fill: string;
  /** The number's color: `textColor`, or whichever of black or white reads on the fill. */
  content: string;
}

/**
 * The badge's fill and the color of its number. A palette token follows the
 * scheme, and its number takes black or white by the token's value rather
 * than by the fill, which on web is a CSS variable that cannot be read. Any
 * other color is read as React Native reads it, so a name or an `rgb()`
 * picks black or white as a hex color does; one that cannot be read (a CSS
 * variable of the app's own) takes white.
 */
export function useBadgeColors({color = 'destructive', textColor}: Pick<BadgeProps, 'color' | 'textColor'>): BadgeColors {
  const token = isColorToken(color) ? color : undefined;
  const resolved = useColor(token ?? 'destructive');
  const palette = usePalette();
  const value = token ? palette[token] : color;
  return {fill: token ? resolved : color, content: textColor ?? onAccent(hexColor(value) ?? '')};
}

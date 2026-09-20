import type {GlyphProps} from './shared';
import {Icon} from '../symbol';

/**
 * The same glyph on Windows, where the kit's `Icon` is a Segoe Fluent Icons
 * character rather than a Material Symbols ligature. Only the drawn switcher
 * needs it: above the breakpoint the strip is a real `TabView`, whose icons
 * are the control's own `IconSource`.
 */
export function Glyph({icon, size, tintColor}: GlyphProps) {
  return <Icon icon={icon} size={size} tintColor={tintColor}/>;
}

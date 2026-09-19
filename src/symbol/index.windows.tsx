import type {IconProps} from './index';
import {StyleSheet, Text} from 'react-native';
import {glyphChar, windowsGlyph} from './segoe';

/**
 * The icon font of Windows 11 (Windows 10 carries the older `Segoe MDL2
 * Assets` at the same code points, which DirectWrite falls back to).
 */
export const SYMBOL_FONT = 'Segoe Fluent Icons';

/**
 * Draws an `IconToken` on Windows as a Segoe Fluent Icons glyph in a `Text`,
 * the way WinUI's own `FontIcon` draws it: the code point of the token's
 * `windows` glyph, or of the Material name's Fluent twin (`segoe.ts`).
 *
 * Hidden from assistive technology: the glyph is a private-use character
 * that would be read as nothing useful, and the control around it carries
 * the name.
 */
export function Icon({icon, size = 24, tintColor}: IconProps) {
  const glyph = windowsGlyph(icon);
  if (!glyph) return null;
  return (
    <Text
      accessible={false}
      importantForAccessibility="no"
      style={[styles.glyph, {fontSize: size, lineHeight: size, color: tintColor}]}>
      {glyphChar(glyph)}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: {
    fontFamily: SYMBOL_FONT,
    // Segoe's glyphs advance exactly one em: the box is the icon's box.
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export {windowsGlyph} from './segoe';
export type {IconProps} from './index';

import type {CodegenTypes, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

type ValueEvent = Readonly<{value: boolean}>;

/**
 * A chip on Windows: a WinUI 3 `ToggleButton` with a pill radius, hosted in a
 * XAML island.
 *
 * Windows has no control called a chip, and needs none — a chip is a capsule
 * that is on or off, which is what a `ToggleButton` is. What it brings that a
 * styled button cannot is the UI Automation **toggle pattern**: a screen
 * reader says "on" or "off" rather than reading a chosen filter and an
 * unchosen one the same way. The control keeps its own checked fill here,
 * unlike the icon toggle's island, which replaces it with two colours.
 */
export interface NativeProps extends ViewProps {
  value: boolean;
  /** The chip's text, and its accessible name. */
  label: string;
  /** Segoe Fluent Icons code point for the leading glyph, if there is one. */
  glyph?: string;
  disabled?: boolean;
  accentColor?: string;
  theme?: CodegenTypes.WithDefault<'light' | 'dark' | 'system', 'system'>;
  onValueChange?: CodegenTypes.DirectEventHandler<ValueEvent>;
}

export default codegenNativeComponent<NativeProps>('ExpoInterfaceChip');

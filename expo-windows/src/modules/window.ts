import type {HighContrastState, SystemColors, TitleBarInsets} from '../native';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';

export type {HighContrastState, SystemColors, TitleBarInsets};

/** No high contrast theme, and no colours to speak of: what an app without the library is told. */
const NO_CONTRAST: HighContrastState = {
  enabled: false,
  scheme: '',
  colors: {
    background: '',
    text: '',
    highlight: '',
    highlightText: '',
    buttonFace: '',
    buttonText: '',
    link: '',
    disabledText: '',
  },
};

export interface WindowChromeOptions {
  /** Extend the content into the title bar: the caption buttons over the app's own top row, no system title. */
  extend: boolean;
  /** The scheme the caption buttons are drawn for. */
  theme?: 'light' | 'dark';
}

export interface DragRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NO_INSETS: TitleBarInsets = {left: 0, right: 0, height: 0};

/**
 * `ExpoWindows`, the runtime's own module for what a desktop app sets on
 * its window: the title, which the kit's Windows stack keeps at the
 * focused screen's ("Settings – My App"); the chrome — content extended
 * into the title bar, the insets its caption buttons take, the region that
 * drags the window — which the kit's `useWindowChrome` drives; the window's
 * own background. Nothing happens without the runtime's Windows library in
 * the app.
 */
export const ExpoWindows = {
  setWindowTitle(title: string): void {
    native.window()?.setTitle(title);
  },
  async getWindowTitleAsync(): Promise<string> {
    return (await native.window()?.getTitle()) ?? '';
  },
  /** Resolves whether the title bar took the change: false without the library, or where it cannot be customized. */
  async setWindowChromeAsync(options: WindowChromeOptions): Promise<boolean> {
    return (await native.window()?.setChrome(options.extend, options.theme ?? 'light')) ?? false;
  },
  async getTitleBarInsetsAsync(): Promise<TitleBarInsets> {
    return (await native.window()?.getTitleBarInsets()) ?? NO_INSETS;
  },
  /** The rectangle, in points from the window's top-left, that drags the window while the content is in the title bar. */
  setDragRegion(region: DragRegion): void {
    native.window()?.setDragRegion(region.x, region.y, region.width, region.height);
  },
  /** The window's own background — behind everything, and what shows while it resizes — or the system's for `null`. */
  setWindowBackground(color: string | null): void {
    native.window()?.setBackground(color ?? '');
  },
  /** Whether a high contrast theme is on, its name, and the system's colours for the window's parts; off without the library. */
  async getHighContrastAsync(): Promise<HighContrastState> {
    return (await native.accessibility()?.getHighContrast()) ?? NO_CONTRAST;
  },
  /** Called with the new state when the user turns high contrast on or off, or changes its theme. */
  addHighContrastListener(listener: (state: HighContrastState) => void): {remove(): void} {
    return DeviceEventEmitter.addListener('onHighContrastChanged', listener);
  },
};

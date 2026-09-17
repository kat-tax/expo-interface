/** What the window's chrome is on this platform: not the app's to draw, so nothing is extended and nothing is inset. */
export interface WindowChrome {
  /** Whether the content is drawn into the title bar. */
  extended: boolean;
  /** The caption area to leave clear while extended, in points. */
  insets: {left: number; right: number; height: number};
}

export interface WindowChromeOptions {
  /** Extend the content into the title bar, with the caption buttons over the app's own top row. */
  extend: boolean;
}

const NONE: WindowChrome = {extended: false, insets: {left: 0, right: 0, height: 0}};

/**
 * Asks for the window's chrome. Only Windows has one the app draws into:
 * there, on `expo-windows`, the content extends into the title bar and the
 * kit's root stack header becomes the drag region; on iOS, Android and web
 * this is nothing.
 */
export function useWindowChrome(_options: WindowChromeOptions): void {}

/** The window's chrome as it stands: never extended here. */
export function useWindowChromeState(): WindowChrome {
  return NONE;
}

/** The region that drags the window: nothing to set here. */
export function setDragRegion(_region: {x: number; y: number; width: number; height: number}): void {}

/** What a view can measure itself with: React Native's `measureInWindow`. */
export interface Measurable {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

/** A header's row as the drag region: nothing to report here. */
export function reportDragRegion(_view: Measurable | null, _insets: {left: number; right: number}): void {}

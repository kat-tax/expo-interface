import {createContext, useContext} from 'react';

/**
 * What a `Screen underBar` tells the scrolling content inside it: the space
 * a bar floating over its top takes, and the space the content should keep
 * at its bottom, so a kit list or grid pads its own content and its scroll
 * indicators rather than the app padding by hand. Outside such a screen
 * both are zero.
 */
export interface ScrollInsets {
  top: number;
  bottom: number;
}

export const ScrollInsetsContext = createContext<ScrollInsets>({top: 0, bottom: 0});

/**
 * The insets a scrolling kit component pads its content by: the screen's
 * under a bar (`Screen underBar`), plus what the caller asked for itself.
 */
export function useScrollInsets(own?: {top?: number; bottom?: number}): ScrollInsets {
  const screen = useContext(ScrollInsetsContext);
  return {top: screen.top + (own?.top ?? 0), bottom: screen.bottom + (own?.bottom ?? 0)};
}

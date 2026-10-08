import {createContext, useContext} from 'react';

/**
 * What a `Screen` tells the scrolling content inside it: the space a bar
 * floating over its top takes, and the space the content should keep at its
 * bottom, so a kit list or grid pads its content (and on iOS the grid's scroll
 * indicators) rather than the app padding by hand. Outside a screen both are
 * zero, and so they are in a `Sheet`'s content and a `Popover`'s, which
 * float over the screen and pass under neither.
 */
export interface ScrollInsets {
  /**
   * The bar floating over the screen's top, on a `Screen underBar`: the web
   * tab bar, or the stack header of a `TabStack` with a `material` on iOS,
   * with the rows under it. Zero on any other screen.
   */
  top: number;
  /**
   * The room the tab bar's floating action takes at the screen's bottom, the
   * button and the gap above it (`Tabs action` on Android, and on iOS before
   * 26), on every screen under the tabs while they show, `underBar` or not.
   * Zero elsewhere.
   */
  bottom: number;
  /**
   * iOS, on a `Screen underBar` under a header the screen runs under: the
   * platform insets scroll content by the header itself, and follows it as
   * a native search bar grows and collapses (UIKit's content inset
   * adjustment, which a scroll view takes with
   * `contentInsetAdjustmentBehavior="automatic"`, and SwiftUI's safe area). `top` is then what the platform does not know of,
   * a `HeaderAccessory` floating under the header.
   */
  automatic: boolean;
}

/**
 * No insets: what content that floats over the screen rather than under its
 * bars (a sheet's content, a popover's card) gives the scrollers in it, so a
 * `FieldGroup`, `List` or `CardGrid` there pads only by its own insets,
 * whatever screen it opens from; and what they read outside a screen.
 */
export const NO_SCROLL_INSETS: ScrollInsets = {top: 0, bottom: 0, automatic: false};

export const ScrollInsetsContext = createContext<ScrollInsets>(NO_SCROLL_INSETS);

/**
 * The insets a scrolling kit component pads its content by: the screen's
 * (a bar it passes under on a `Screen underBar`, the tab bar's floating
 * action), plus what the caller asked for itself. It reads the `Screen`
 * above the caller: call it in a component the `Screen` renders (or use
 * `ScreenScrollView`), since the component that renders the `Screen` is
 * outside it and reads zeros.
 */
export function useScrollInsets(own?: {top?: number; bottom?: number}): ScrollInsets {
  const screen = useContext(ScrollInsetsContext);
  return {top: screen.top + (own?.top ?? 0), bottom: screen.bottom + (own?.bottom ?? 0), automatic: screen.automatic};
}

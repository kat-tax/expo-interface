/**
 * The kit's compact size class: narrower than 640 points. Under it `TabView`
 * shows its switcher rather than a strip, and a `Toolbar` that folds its
 * commands puts them behind its overflow. 640 is both WinUI's compact
 * breakpoint and the top of Android's compact window class, and it is
 * measured on the component rather than read from the window, since a pane
 * beside it changes the room it has.
 */
export const COMPACT_WIDTH = 640;

/** Whether a measured width is in the compact size class; a width not measured yet is not. */
export function isCompact(width: number): boolean {
  return width > 0 && width < COMPACT_WIDTH;
}

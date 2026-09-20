import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/**
 * A row of full-width pages that snaps to one at a time, with the indicator
 * that says which one is on screen.
 *
 * The scroller is the platform's own on all four: `pagingEnabled` is
 * `UIScrollView.isPagingEnabled` on iOS, a snapping `ReactScrollView` on
 * Android, `PagingEnabled` on react-native-windows' composition scroller, and
 * `scroll-snap-type: x mandatory` in the browser. So there is no hosting
 * boundary anywhere: the pages are ordinary React Native children, and the
 * momentum, the rubber-banding and the snap curve are the system's.
 *
 * The indicator is where a platform control still fits, because it has no
 * children to host: Windows draws a WinUI 3 `PipsPager`, with the chevrons
 * Fluent shows on hover. iOS and Android draw dots — `UIPageControl` and
 * Material's indicator are not reachable from React Native.
 *
 * Web adds what the DOM makes possible and the others leave to the system:
 * the pages are a tab panel each, inert while off screen, so the keyboard
 * cannot land inside a page nobody can see.
 */
export interface PagerProps {
  /** The page on screen, by index. The kit owns it on every platform. */
  page: number;
  /**
   * The page the scroller settled on, or the one a dot asked for.
   *
   * A swipe reports the page it landed on and nothing more: if `page` does
   * not follow, the view stays where the finger left it rather than springing
   * back, which is what every platform's scroller does on its own.
   */
  onPageChange: (page: number) => void;
  /** One child per page. */
  children: ReactNode;
  /**
   * Draw the indicator under the pages.
   * @default true
   */
  indicator?: boolean;
  /**
   * What the whole pager is called — "Onboarding", "Screenshots". Each page
   * is named after it by number, so a screen reader says "2 of 5".
   */
  label?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

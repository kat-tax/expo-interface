import type {HeaderAccessoryProps} from './types';
import {ScreenBar} from '../screen/bars';

/**
 * iOS and Android: the platform's header has no row of the app's own, so the
 * row is the screen's, at its top (`ScreenBar`). Under an opaque header it
 * sits above the content, across the screen, with the content right under
 * it. Under an iOS header the content runs under (a
 * `TabStack` with a `material`), it floats at the header's bottom edge in the
 * header's material, and `useTabBarInset()` counts its height, so content
 * passing under the header passes under the row too.
 */
export function HeaderAccessory({children}: HeaderAccessoryProps) {
  return <ScreenBar edge="top">{children}</ScreenBar>;
}

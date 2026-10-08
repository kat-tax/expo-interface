import type {BadgeProps} from './types';
import {DrawnBadge} from './drawn';
import {UIKIT_BADGE} from './shared';

/**
 * iOS draws the badge rather than hosting one.
 *
 * SwiftUI has a `badge` modifier, and `@expo/ui` exposes it, but it only paints
 * where SwiftUI decides to honour it: inside a `List` row, on a `TabView` item,
 * on a toolbar item. Anywhere else it is accepted and silently does nothing,
 * which is the worst outcome — a badge that compiles, passes its test and is
 * invisible. It belongs on `ListItem` and `Tabs`, where those contexts exist.
 *
 * So this is the capsule UIKit draws: the destructive red, a single digit in a
 * circle, more digits in a capsule, and the accessible name on the view rather
 * than on the number.
 */
export function Badge(props: BadgeProps) {
  return <DrawnBadge {...props} metrics={UIKIT_BADGE}/>;
}

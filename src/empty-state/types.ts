import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {IconToken} from '../icons';

/**
 * What a screen shows when it has nothing to show: no drops yet, no results for
 * a search, no connection. A centred icon, a line saying what is missing, a
 * sentence saying why, and usually one thing to do about it.
 *
 * - iOS: `ContentUnavailableView`, the system's own — so it takes Apple's
 *   layout, its metrics and its Dynamic Type behaviour rather than an
 *   approximation of them. It needs iOS 17; below that the kit draws it.
 * - Android, Windows, web: composed from the kit's own icon and typography.
 *   None of those platforms has a single control for this.
 */
export interface EmptyStateProps {
  /** One line: what is not here. */
  title: string;
  /** A sentence under it: why, or what to do. */
  description?: string;
  /** The icon above the title. */
  icon?: IconToken;
  /**
   * One thing to do about it, usually a `Button`. Drawn below the description
   * on every platform.
   */
  action?: ReactNode;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

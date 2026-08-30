import type {ReactNode} from 'react';
import type {IconToken} from '../icons';
import type {ButtonProps} from '../button/types';

/** One entry of a `Menu` / `ContextMenu`. */
export interface MenuItem {
  /** Item text. */
  label: string;
  /** Leading icon. */
  icon?: IconToken;
  /**
   * `destructive` renders the item in the danger color.
   * @default 'default'
   */
  role?: 'default' | 'destructive';
  /** Greys the item out and ignores presses. */
  disabled?: boolean;
  /** Draw a separator above this item. */
  separator?: boolean;
  /** Called when the item is selected; the menu then closes. */
  onPress?: () => void;
}

/**
 * Cross-platform dropdown menu opened from a button.
 *
 * Bridges the SwiftUI `Menu` on iOS, the Jetpack Compose Material 3
 * `DropdownMenu` on Android, and a `role="menu"` popup on web. The trigger
 * looks like the kit's `Button` and takes the same styling props.
 */
export interface MenuProps extends Pick<ButtonProps, 'variant' | 'size' | 'shape' | 'color' | 'hideLabel' | 'disabled'> {
  /** Trigger text (kept for accessibility when `hideLabel` is set). */
  label: string;
  /** Trigger icon. */
  icon?: IconToken;
  /** Entries shown when the menu opens. */
  items: MenuItem[];
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

/**
 * Cross-platform context menu attached to arbitrary content.
 *
 * Opens on long-press (iOS `contextMenu`, Android `DropdownMenu` anchored by
 * `combinedClickable`) or right-click / long-press on web. `children` must
 * be native (`@expo/ui`) content on iOS/Android.
 */
export interface ContextMenuProps {
  /** Entries shown when the menu opens. */
  items: MenuItem[];
  /** Content that triggers the menu. */
  children: ReactNode;
  /** Called on a plain tap of the content (Android/web; iOS taps pass through). */
  onPress?: () => void;
  /** Disables the menu. */
  disabled?: boolean;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

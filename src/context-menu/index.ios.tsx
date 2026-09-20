import type {ContextMenuProps} from '../menu/types';

import {ContextMenu as SwiftUIContextMenu, Menu as SwiftUIMenu} from '@expo/ui/swift-ui';
import {onTapGesture} from '@expo/ui/swift-ui/modifiers';
import {MenuItems} from '../menu/index.ios';

/**
 * iOS has two controls here, and `trigger` picks between them rather than the
 * kit timing a gesture of its own.
 *
 * `longPress` is SwiftUI's `contextMenu`: a long-press on `children` lifts it
 * into a preview with the entries beneath. A plain tap is passed to `onPress`
 * through `onTapGesture`.
 *
 * `tap` is SwiftUI's `Menu` with `children` as its label — the same control
 * the kit's own `Menu` renders, so the menu that opens is the system's in
 * both modes. Its `onPrimaryAction` is deliberately not wired: giving it one
 * would make a tap the action and a long-press the menu, which is exactly
 * `longPress` with extra steps.
 *
 * SwiftUI has no menu at a point, so `at` is ignored here (the gesture stays
 * the trigger) and `onDismiss` is not reported.
 */
export function ContextMenu({items, children, onPress, disabled, trigger = 'longPress', testID}: ContextMenuProps) {
  if (disabled) return <>{children}</>;
  if (trigger === 'tap') {
    return (
      <SwiftUIMenu label={children} testID={testID}>
        <MenuItems items={items}/>
      </SwiftUIMenu>
    );
  }
  return (
    <SwiftUIContextMenu modifiers={onPress ? [onTapGesture(onPress)] : undefined} testID={testID}>
      <SwiftUIContextMenu.Trigger>{children}</SwiftUIContextMenu.Trigger>
      <SwiftUIContextMenu.Items>
        <MenuItems items={items}/>
      </SwiftUIContextMenu.Items>
    </SwiftUIContextMenu>
  );
}

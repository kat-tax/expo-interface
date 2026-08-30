import type {ContextMenuProps} from '../menu/types';

import {ContextMenu as SwiftUIContextMenu} from '@expo/ui/swift-ui';
import {onTapGesture} from '@expo/ui/swift-ui/modifiers';
import {MenuItems} from '../menu/index.ios';

/**
 * iOS renders SwiftUI's `contextMenu`: a long-press on `children` lifts it
 * into a preview with the entries beneath. `children` must be SwiftUI
 * content. A plain tap is passed to `onPress` through `onTapGesture`.
 */
export function ContextMenu({items, children, onPress, disabled, testID}: ContextMenuProps) {
  if (disabled) return <>{children}</>;
  return (
    <SwiftUIContextMenu modifiers={onPress ? [onTapGesture(onPress)] : undefined} testID={testID}>
      <SwiftUIContextMenu.Trigger>{children}</SwiftUIContextMenu.Trigger>
      <SwiftUIContextMenu.Items>
        <MenuItems items={items}/>
      </SwiftUIContextMenu.Items>
    </SwiftUIContextMenu>
  );
}

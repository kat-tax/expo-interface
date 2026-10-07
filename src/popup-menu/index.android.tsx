import type {PopupMenuProps} from './types';
import {StyleSheet} from 'react-native';
import {Box, DropdownMenu} from '@expo/ui/jetpack-compose';
import {matchParentSize, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost} from '../host';
import {MenuItems} from '../menu/index.android';
import {filterItems, sizeOf} from './types';

/**
 * Android lays a host the size of a point over the content at `at` and
 * anchors a Material 3 `DropdownMenu` to it. The menu is a window of its
 * own, so the host takes no space and no touches. Beside a rectangle the
 * anchor is a strip one point wide and the rectangle's height at its
 * leading edge: Compose opens the menu under its anchor, and over it when
 * there is no room, so the menu opens beside the rectangle, never over it.
 * That is Compose's own choice of side, whatever `preferredEdge` asks.
 */
export function PopupMenu({items, at, filter, onDismiss, testID}: PopupMenuProps) {
  const {height} = sizeOf(at);
  return (
    <NativeHost
      fit
      pointerEvents="box-none"
      style={[styles.anchor, {left: at?.x ?? 0, top: at?.y ?? 0}]}>
      <Box modifiers={[size(1, Math.max(1, height)), ...(testID ? [testIDModifier(testID)] : [])]}>
        <DropdownMenu expanded={at != null} onDismissRequest={() => onDismiss?.('dismiss')} modifiers={[matchParentSize()]}>
          <MenuItems items={filterItems(items, filter)} onClose={() => onDismiss?.('select')}/>
        </DropdownMenu>
      </Box>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  anchor: {position: 'absolute'},
});

import type {PopupMenuProps} from './types';
import {StyleSheet} from 'react-native';
import {Box, DropdownMenu} from '@expo/ui/jetpack-compose';
import {matchParentSize, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost} from '../host';
import {MenuItems} from '../menu/index.android';
import {filterItems} from './types';

/**
 * Android lays a host the size of a point over the content at `at` and
 * anchors a Material 3 `DropdownMenu` to it. The menu is a window of its
 * own, so the host takes no space and no touches.
 */
export function PopupMenu({items, at, filter, onDismiss, testID}: PopupMenuProps) {
  const close = () => onDismiss?.();
  return (
    <NativeHost
      fit
      pointerEvents="box-none"
      style={[styles.anchor, {left: at?.x ?? 0, top: at?.y ?? 0}]}>
      <Box modifiers={[size(1, 1), ...(testID ? [testIDModifier(testID)] : [])]}>
        <DropdownMenu expanded={at != null} onDismissRequest={close} modifiers={[matchParentSize()]}>
          <MenuItems items={filterItems(items, filter)} onClose={close}/>
        </DropdownMenu>
      </Box>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  anchor: {position: 'absolute'},
});

import type {ContextMenuProps} from '../menu/types';

import {useState} from 'react';
import {Box, DropdownMenu} from '@expo/ui/jetpack-compose';
import {combinedClickable, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {MenuItems} from '../menu/index.android';

/**
 * Android wraps `children` in a `Box` with `combinedClickable`, so a
 * long-press expands a Material 3 `DropdownMenu` anchored to it while a tap
 * goes to `onPress`. `children` must be Compose content.
 */
export function ContextMenu({items, children, onPress, disabled, testID}: ContextMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const modifiers = [
    ...(disabled ? [] : [combinedClickable({onClick: onPress, onLongClick: () => setExpanded(true)})]),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
  return (
    <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
      <DropdownMenu.Trigger>
        <Box modifiers={modifiers}>{children}</Box>
      </DropdownMenu.Trigger>
      <MenuItems items={items} onClose={() => setExpanded(false)}/>
    </DropdownMenu>
  );
}

import type {ContextMenuProps} from '../menu/types';

import {useState} from 'react';
import {Box, DropdownMenu} from '@expo/ui/jetpack-compose';
import {combinedClickable, matchParentSize, offset, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {MenuItems} from '../menu/index.android';

/**
 * Android wraps `children` in a `Box` with `combinedClickable`, so a
 * long-press expands a Material 3 `DropdownMenu` while a tap goes to
 * `onPress`. `children` must be Compose content.
 *
 * The dropdown is anchored to an invisible box laid over the content: the
 * size of the content for a long-press (the menu opens below it, as a
 * Compose menu does), or a zero-size box offset to the `at` point, which is
 * how the menu opens where a canvas says it was asked for.
 */
export function ContextMenu({items, children, onPress, disabled, at, onDismiss, testID}: ContextMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const [point, setPoint] = useState(at ?? null);
  // A new `at` (including one given at mount) opens the menu there; derived
  // from the prop as it changes.
  const [seen, setSeen] = useState<ContextMenuProps['at']>(undefined);
  if (at !== seen) {
    setSeen(at);
    if (at && !disabled) {
      setPoint(at);
      setExpanded(true);
    }
  }
  const close = () => {
    setExpanded(false);
    onDismiss?.();
  };

  const modifiers = [
    ...(disabled ? [] : [combinedClickable({onClick: onPress, onLongClick: () => {
      setPoint(null);
      setExpanded(true);
    }})]),
    ...(testID ? [testIDModifier(testID)] : []),
  ];

  return (
    <Box modifiers={modifiers}>
      {children}
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={close}
        modifiers={point ? [offset(point.x, point.y), size(0, 0)] : [matchParentSize()]}>
        <MenuItems items={items} onClose={close}/>
      </DropdownMenu>
    </Box>
  );
}

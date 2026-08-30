import '../menu/menu.css';
import type {MouseEvent, PointerEvent} from 'react';
import type {ContextMenuProps} from '../menu/types';
import {useId, useRef, useState} from 'react';
import {MenuList, menuIdent} from '../menu/list';

const LONG_PRESS_MS = 500;

/**
 * On web the entries live in the same native `popover="auto"` element as
 * `Menu`, opened with `showPopover()` on right-click (`contextmenu`) or a
 * touch long-press and placed at the pointer. The browser still owns the top
 * layer and light dismiss. The wrapper is `display: contents`, so it doesn't
 * affect the layout of `children`.
 */
export function ContextMenu({items, children, onPress, disabled, testID}: ContextMenuProps) {
  const ident = menuIdent(useId());
  const popover = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{x: number; y: number} | null>(null);

  const open = (x: number, y: number) => {
    setPosition({x, y});
    const element = popover.current;
    if (element && !element.matches(':popover-open')) element.showPopover();
  };
  const onContextMenu = (event: MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    open(event.clientX, event.clientY);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (disabled || event.pointerType !== 'touch') return;
    const {clientX: x, clientY: y} = event;
    timer.current = setTimeout(() => open(x, y), LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <div
      className="ui-context-menu"
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onPointerMove={cancelPress}
      onClick={disabled ? undefined : onPress}
      data-testid={testID}>
      {children}
      <MenuList id={ident} items={items} position={position} popoverRef={popover}/>
    </div>
  );
}

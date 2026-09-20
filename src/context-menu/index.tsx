import '../menu/menu.css';
import type {MouseEvent, PointerEvent} from 'react';
import type {ContextMenuProps} from '../menu/types';
import {useEffect, useId, useRef, useState} from 'react';
import {MenuList, menuIdent} from '../menu/list';

const LONG_PRESS_MS = 500;

/**
 * On web the entries live in the same native `popover="auto"` element as
 * `Menu`, opened with `showPopover()` on right-click (`contextmenu`), a touch
 * long-press, or the `at` prop, and placed at the pointer. The browser still
 * owns the top layer and light dismiss. The wrapper is `display: contents`,
 * so it doesn't affect the layout of `children`; `at` is measured against
 * the content's first element (its own coordinates), falling back to the
 * viewport when the content has no box of its own.
 *
 * **`contextmenu` opens the menu whichever `trigger` says**, because a right
 * click is what a pointer user and every assistive technology on this
 * platform already reach for, and the Menu key raises the same event.
 * `trigger: 'tap'` adds the click on top of it and takes the touch
 * long-press away — on a touch screen the tap is now the gesture, and
 * leaving the long-press would open the menu twice for one intent.
 */
export function ContextMenu({items, children, onPress, disabled, at, onDismiss, onOpenChange, trigger = 'longPress', testID}: ContextMenuProps) {
  const ident = menuIdent(useId());
  const popover = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
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
    if (disabled || trigger === 'tap' || event.pointerType !== 'touch') return;
    const {clientX: x, clientY: y} = event;
    timer.current = setTimeout(() => open(x, y), LONG_PRESS_MS);
  };
  const onClick = (event: MouseEvent) => {
    if (disabled) return;
    if (trigger !== 'tap') {
      onPress?.();
      return;
    }
    open(event.clientX, event.clientY);
  };
  const cancelPress = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // A point the content reports (a canvas's own right click): relative to
  // the content's box, which `display: contents` leaves to its first child
  // (the popover itself when the content has no element of its own, in which
  // case the point is taken as viewport coordinates).
  useEffect(() => {
    if (!at || disabled) return;
    const content = wrapper.current!.firstElementChild;
    const rect = content !== popover.current ? content!.getBoundingClientRect() : {left: 0, top: 0};
    setPosition({x: rect.left + at.x, y: rect.top + at.y});
    const element = popover.current;
    if (element && !element.matches(':popover-open')) element.showPopover();
  }, [at, disabled]);

  return (
    <div
      ref={wrapper}
      className="ui-context-menu"
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onPointerMove={cancelPress}
      onClick={onClick}
      data-testid={testID}>
      {children}
      <MenuList
        id={ident}
        items={items}
        position={position}
        popoverRef={popover}
        onOpenChange={isOpen => {
          onOpenChange?.(isOpen);
          if (!isOpen) onDismiss?.();
        }}
      />
    </div>
  );
}

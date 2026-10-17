import '../menu/menu.css';
import type {MouseEvent} from 'react';
import type {ContextMenuProps} from '../menu/types';
import {useEffect, useId, useRef, useState} from 'react';
import {MenuList, menuIdent} from '../menu/list';
import {afterRelease} from '../menu/release';
import {useHeldTouch} from './held';

/**
 * On web the entries live in the same native `popover="auto"` element as
 * `Menu`, opened with `showPopover()` on right-click (`contextmenu`), once a
 * held touch lifts, or from the `at` prop, and placed at the pointer. The
 * browser still owns the top layer and light dismiss. The wrapper is
 * `display: contents`, so it doesn't affect the layout of `children`; `at` is
 * measured against the content's first element (its own coordinates), falling
 * back to the viewport when the content has no box of its own.
 *
 * The held touch is `useHeldTouch`'s: the hold arms the menu, the release's
 * click is taken as the menu's rather than the content's press, and the menu
 * shows in a task after it, since one shown while the touch is down is
 * light-dismissed by the release. A right click is the same where the
 * platform raises `contextmenu` while the button is still down (Linux,
 * macOS): the menu shows in a task after the button comes up. Windows raises
 * it after the release, and the Menu key with no button down, and there the
 * menu shows at once.
 *
 * **`contextmenu` opens the menu whichever `trigger` says**, because a right
 * click is what a pointer user and every assistive technology on this
 * platform already reach for, and the Menu key raises the same event.
 * `trigger: 'tap'` adds the click on top of it and takes the touch
 * long-press away — on a touch screen the tap is now the gesture, and
 * leaving the long-press would open the menu twice for one intent.
 */
export function ContextMenu({items, children, onPress, disabled, at, onDismiss, onOpenChange, trigger = 'longPress', material, testID}: ContextMenuProps) {
  const ident = menuIdent(useId());
  const popover = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{x: number; y: number} | null>(null);

  const open = (x: number, y: number) => {
    setPosition({x, y});
    const element = popover.current;
    if (element && !element.matches(':popover-open')) element.showPopover();
  };
  const held = useHeldTouch(open, !disabled && trigger !== 'tap');
  // A right click's menu waiting for its button to come up.
  const pending = useRef<(() => void) | null>(null);
  useEffect(() => () => pending.current?.(), []);
  // The menu's popover sits inside the wrapper, in React's tree and the DOM
  // alike (the top layer moves its box, not its place in the tree), so its
  // clicks and right clicks reach the wrapper's handlers. They are the
  // menu's: choosing an entry presses no content and, for `tap`, does not
  // open the menu again as it closes; a right click on the menu opens
  // nothing, and the browser's own menu does not cover the kit's.
  const inMenu = (event: MouseEvent) => popover.current!.contains(event.target as Node);
  const onContextMenu = (event: MouseEvent) => {
    if (inMenu(event)) {
      event.preventDefault();
      return;
    }
    if (disabled) return;
    event.preventDefault();
    // A browser that raises `contextmenu` for the held touch as well (Chrome
    // on Android) opens the menu with it, once.
    held.cancel();
    pending.current?.();
    pending.current = null;
    const {clientX: x, clientY: y} = event;
    if (event.buttons === 0) {
      open(x, y);
      return;
    }
    pending.current = afterRelease(() => {
      pending.current = null;
      open(x, y);
    });
  };
  const onClick = (event: MouseEvent) => {
    if (disabled || inMenu(event)) return;
    if (trigger !== 'tap') {
      onPress?.();
      return;
    }
    open(event.clientX, event.clientY);
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
      onClick={onClick}
      {...held.handlers()}
      data-testid={testID}>
      {children}
      <MenuList
        id={ident}
        items={items}
        position={position}
        popoverRef={popover}
        material={material}
        onOpenChange={isOpen => {
          onOpenChange?.(isOpen);
          if (!isOpen) onDismiss?.();
        }}
      />
    </div>
  );
}

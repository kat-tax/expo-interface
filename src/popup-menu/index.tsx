import '../menu/menu.css';
import type {CSSProperties} from 'react';
import type {PopupMenuProps} from './types';
import {useEffect, useId, useRef} from 'react';
import {MenuList, menuIdent} from '../menu/list';
import {filterItems} from './types';

/**
 * On web the entries live in the same native `popover="auto"` element as
 * `Menu`, opened with `showPopover()` and laid out by CSS anchor positioning
 * against a zero-size anchor placed at `at` — so the browser flips the popup
 * to keep it on screen, and closes it on an outside click or Escape.
 */
export function PopupMenu({items, at, filter, onDismiss, testID}: PopupMenuProps) {
  const ident = menuIdent(useId());
  const anchor = `--${ident}`;
  const popover = useRef<HTMLDivElement>(null);
  const point = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // The popover element is in the DOM by the time an effect runs.
    const element = popover.current!;
    const open = element.matches(':popover-open');
    if (at && !open) element.showPopover();
    if (!at && open) element.hidePopover();
  }, [at]);

  return (
    <span
      ref={point}
      className="ui-popup-menu"
      data-testid={testID}
      style={{
        anchorName: anchor,
        left: at?.x ?? 0,
        top: at?.y ?? 0,
      } as CSSProperties}>
      <MenuList
        id={ident}
        items={filterItems(items, filter)}
        anchor={anchor}
        atPoint
        anchorRef={point}
        popoverRef={popover}
        onOpenChange={open => {
          if (!open) onDismiss?.();
        }}
      />
    </span>
  );
}

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
  const pressed = usePointerDown();

  useEffect(() => {
    // The popover element is in the DOM by the time an effect runs.
    const element = popover.current!;
    const open = element.matches(':popover-open');
    if (!at) {
      if (open) element.hidePopover();
      return;
    }
    if (open) return;
    if (!pressed.current) {
      element.showPopover();
      return;
    }
    // A menu raised from a press has to outlast it. The browser draws up what
    // a press dismisses when the pointer goes *down*, and a popover shown
    // after that is not on the list, so the release hides it again — which is
    // the whole gesture for a context menu on the right button's press. Open
    // it once the pointer that is down has come up, when there is no longer a
    // dismissal with this popover's name on it.
    const show = () => {
      document.removeEventListener('pointerup', show);
      document.removeEventListener('pointercancel', show);
      element.showPopover();
    };
    document.addEventListener('pointerup', show);
    document.addEventListener('pointercancel', show);
    return () => {
      document.removeEventListener('pointerup', show);
      document.removeEventListener('pointercancel', show);
    };
  }, [at, pressed]);

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

/**
 * Whether a pointer button is down, as a ref.
 *
 * Watched from the mount rather than from the open: the press that raises the
 * menu is what sets `at`, so by the time the opening effect runs there is no
 * event left to ask. A `PopupMenu` sits in the tree with `at` null until it is
 * wanted, which is early enough to have seen the press go down.
 */
function usePointerDown() {
  const down = useRef(false);
  useEffect(() => {
    const press = () => {
      down.current = true;
    };
    const release = () => {
      down.current = false;
    };
    // Captured, so the answer is already right by the time anything acts on it.
    document.addEventListener('pointerdown', press, true);
    document.addEventListener('pointerup', release, true);
    document.addEventListener('pointercancel', release, true);
    return () => {
      document.removeEventListener('pointerdown', press, true);
      document.removeEventListener('pointerup', release, true);
      document.removeEventListener('pointercancel', release, true);
    };
  }, []);
  return down;
}

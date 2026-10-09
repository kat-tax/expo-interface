import '../menu/menu.css';
import type {CSSProperties} from 'react';
import type {PopupMenuProps} from './types';
import {useEffect, useId, useRef} from 'react';
import {MenuList, menuIdent} from '../menu/list';
import {useEscape} from '../popover/shared';
import {filterItems, sizeOf} from './types';

/**
 * On web the entries live in the same native `popover="auto"` element as
 * `Menu`, opened with `showPopover()` and laid out by CSS anchor positioning
 * against an anchor placed at `at` (a point, or a box the size of the
 * rectangle), so the browser flips the popup to keep it on screen, and
 * closes it on an outside click. Escape closes it wherever the focus is.
 * A menu raised while a pointer button is down, as a context menu is from
 * the right button's press, opens in a task after the release, since the
 * browser dismisses with that press whatever it shows before the release is
 * over. A new point made by such a press outside the popup (the next
 * handle's button going down) closes it as the app's own close and shows it
 * at the new place the same way.
 */
export function PopupMenu({items, at, preferredEdge = 'auto', filter, takesFocus = true, highlighted, id, onDismiss, testID}: PopupMenuProps) {
  const generated = menuIdent(useId());
  const ident = id ?? generated;
  const anchor = `--${generated}`;
  const popover = useRef<HTMLDivElement>(null);
  const point = useRef<HTMLSpanElement>(null);
  const pressed = usePointerDown();
  // Why the popup is closing, when it is not a dismissal: a pick, or a close
  // the app caused (clearing `at`, or moving it during a press), which it
  // already knows of and is not told about.
  const closing = useRef<'select' | 'app' | null>(null);
  // A missing point closes it too, as on iOS and Android.
  const open = at != null;
  const x = at?.x;
  const y = at?.y;
  const size = sizeOf(at);

  // Keyed on the point's values, not on `at` itself: an app that hands in a
  // new object for the same point on every render would otherwise read as a
  // move, and a press outside could never dismiss the menu.
  useEffect(() => {
    // The popover element is in the DOM by the time an effect runs.
    const element = popover.current!;
    const showing = element.matches(':popover-open');
    if (!open) {
      if (showing) {
        closing.current = 'app';
        element.hidePopover();
      }
      return;
    }
    if (showing) {
      // Moved with nothing pressed (the caret, the keys): the anchor moves,
      // and the popup with it.
      if (!pressed.current) return;
      // Moved by a press outside the popup: its release would dismiss it, so
      // it is closed here as the app's own close and shown at the new place
      // in the task after the press.
      closing.current = 'app';
      element.hidePopover();
    }
    // The only place `closing` is reset before a show: a close still to come
    // belongs to an earlier menu, and is ignored once this one is up.
    const show = () => {
      closing.current = null;
      element.showPopover();
    };
    if (!pressed.current) {
      show();
      return;
    }
    // A menu raised from a press has to outlast it, which is the whole gesture
    // for a context menu on the right button's press. The browser settles what
    // a press dismisses as the pointer goes down and carries it out at the
    // release, after the release's own listeners have run: a popover shown
    // while the button is held is hidden again, and so is one shown from the
    // `pointerup` listener itself, which Chrome light-dismisses with that same
    // press, before its click. So the menu is shown in a task of its own after
    // the release, once the press and its dismissal are over.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const released = () => {
      document.removeEventListener('pointerup', released);
      document.removeEventListener('pointercancel', released);
      timer = setTimeout(show, 0);
    };
    document.addEventListener('pointerup', released);
    document.addEventListener('pointercancel', released);
    return () => {
      document.removeEventListener('pointerup', released);
      document.removeEventListener('pointercancel', released);
      clearTimeout(timer);
    };
  }, [open, x, y, size.width, size.height, pressed]);

  // Escape closes the menu while it shows, wherever the focus is: an editor
  // that holds it and keeps the key for itself would otherwise leave the
  // menu up. The key is the menu's then, and goes no further, so neither a
  // web `Sheet` nor a `Popover` card around the menu closes with it. The
  // taker is this one rather than the list's own, which is off: it is up
  // from the point, reading the popover itself, before the browser has
  // reported the opening.
  useEscape(
    open,
    popover,
    () => popover.current!.hidePopover(),
    () => popover.current!.matches(':popover-open'),
  );

  return (
    <span
      ref={point}
      className="ui-popup-menu"
      data-testid={testID}
      style={{
        anchorName: anchor,
        left: at?.x ?? 0,
        top: at?.y ?? 0,
        width: size.width,
        height: size.height,
      } as CSSProperties}>
      <MenuList
        id={ident}
        items={filterItems(items, filter)}
        match={filter}
        anchor={anchor}
        atPoint
        edge={preferredEdge}
        focusOnOpen={takesFocus}
        highlighted={highlighted}
        anchorRef={point}
        popoverRef={popover}
        takesEscape={false}
        onPick={() => {
          closing.current = 'select';
        }}
        onOpenChange={next => {
          if (next) return;
          const reason = closing.current;
          closing.current = null;
          if (reason !== 'app') onDismiss?.(reason === 'select' ? 'select' : 'dismiss');
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

export type {MenuRect, PopupMenuDismissReason, PopupMenuProps} from './types';

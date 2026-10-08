import '../menu/menu.css';
import type {CSSProperties} from 'react';
import type {PopupMenuProps} from './types';
import {useEffect, useId, useRef} from 'react';
import {MenuList, menuIdent} from '../menu/list';
import {filterItems, sizeOf} from './types';

/**
 * On web the entries live in the same native `popover="auto"` element as
 * `Menu`, opened with `showPopover()` and laid out by CSS anchor positioning
 * against an anchor placed at `at` (a point, or a box the size of the
 * rectangle), so the browser flips the popup to keep it on screen, and
 * closes it on an outside click. Escape closes it wherever the focus is.
 * A new point made by a press outside the popup (the next handle's button
 * going down) closes it as the app's own close and shows it at the new
 * place once the press is over, since the release would otherwise dismiss
 * it.
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
      // once the press is over.
      closing.current = 'app';
      element.hidePopover();
    }
    // The only place `closing` is reset before a show: a close still to come
    // belongs to an earlier menu, and is ignored once this one is up.
    const show = () => {
      document.removeEventListener('pointerup', show);
      document.removeEventListener('pointercancel', show);
      closing.current = null;
      element.showPopover();
    };
    if (!pressed.current) {
      show();
      return;
    }
    // A menu raised from a press has to outlast it. The browser draws up what
    // a press dismisses when the pointer goes *down*, and a popover shown
    // after that is not on the list, so the release hides it again, which is
    // the whole gesture for a context menu on the right button's press. Open
    // it once the pointer that is down has come up, when there is no longer a
    // dismissal with this popover's name on it.
    document.addEventListener('pointerup', show);
    document.addEventListener('pointercancel', show);
    return () => {
      document.removeEventListener('pointerup', show);
      document.removeEventListener('pointercancel', show);
    };
  }, [open, x, y, size.width, size.height, pressed]);

  // Escape closes the menu wherever the focus is: an editor that holds it
  // and keeps the key for itself would otherwise leave the menu up. The key
  // is the menu's then, and goes no further. The window's capture phase
  // comes before the document's, where an overlay around the menu (a web
  // `Sheet`) listens for the key to close itself.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const element = popover.current!;
      if (event.key !== 'Escape' || !element.matches(':popover-open')) return;
      event.stopPropagation();
      element.hidePopover();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

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

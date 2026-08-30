import type {CSSProperties, ToggleEvent} from 'react';
import type {MenuItem} from './types';
import {useRef} from 'react';
import {SymbolView} from 'expo-symbols';

const ICON_SIZE = 16;
const VIEWPORT_GAP = 8;

/** Whether the browser lays out `position-anchor` natively (Baseline 2026). */
const ANCHOR_SUPPORTED =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('position-anchor', '--ui-menu');

/** Turns a React `useId()` value into a valid CSS `<dashed-ident>` / HTML id. */
export function menuIdent(id: string): string {
  return `ui-menu-${id.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

interface MenuListProps {
  /** HTML id of the popover, referenced by the trigger's `popovertarget`. */
  id: string;
  items: MenuItem[];
  /** `anchor-name` of the trigger; the popup is laid out relative to it. */
  anchor?: string;
  /** Element to measure when the browser lacks CSS anchor positioning. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Fixed viewport position (context menus) instead of an anchor. */
  position?: {x: number; y: number} | null;
  /** Exposes the popover element so callers can `showPopover()` programmatically. */
  popoverRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Web `role="menu"` popup shared by `Menu` and `ContextMenu`, rendered as a
 * native `popover="auto"` element. The browser handles the top layer, light
 * dismiss (outside click / Escape) and the trigger's `aria-expanded`; every
 * item carries `popovertargetaction="hide"` so picking one closes the menu
 * declaratively. Placement is CSS anchor positioning (see `menu.css`), with a
 * measured fallback for engines without it.
 */
export function MenuList({id, items, anchor, anchorRef, position, popoverRef}: MenuListProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = popoverRef ?? localRef;
  const anchored = !!anchor && !position;

  const style: Record<string, string | number> = {};
  if (anchored && ANCHOR_SUPPORTED) style.positionAnchor = anchor;
  if (position) {
    style.left = position.x;
    style.top = position.y;
  }

  const onToggle = (event: ToggleEvent<HTMLDivElement>) => {
    const popover = event.currentTarget;
    if (event.newState !== 'open') return;
    // Fallback placement: below the trigger, right-aligned, kept on screen.
    if (anchored && !ANCHOR_SUPPORTED && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      popover.style.left = `${Math.max(VIEWPORT_GAP, rect.right - popover.offsetWidth)}px`;
      popover.style.top = `${rect.bottom + 4}px`;
    }
    // Pointer placement: nudge back inside the viewport.
    if (position) {
      const maxX = window.innerWidth - popover.offsetWidth - VIEWPORT_GAP;
      const maxY = window.innerHeight - popover.offsetHeight - VIEWPORT_GAP;
      popover.style.left = `${Math.max(VIEWPORT_GAP, Math.min(position.x, maxX))}px`;
      popover.style.top = `${Math.max(VIEWPORT_GAP, Math.min(position.y, maxY))}px`;
    }
    (popover.querySelector('button:not(:disabled)') as HTMLButtonElement | null)?.focus();
  };

  return (
    <div
      ref={ref}
      id={id}
      role="menu"
      popover="auto"
      className={['ui-menu__list', anchored && ANCHOR_SUPPORTED && 'ui-menu__list--anchored'].filter(Boolean).join(' ')}
      style={style as CSSProperties}
      onToggle={onToggle}>
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && index > 0 ? <div className="ui-menu__separator" role="separator"/> : null}
          <button
            type="button"
            role="menuitem"
            className={['ui-menu__item', item.role === 'destructive' && 'ui-menu__item--destructive'].filter(Boolean).join(' ')}
            disabled={item.disabled}
            popoverTarget={id}
            popoverTargetAction="hide"
            onClick={item.onPress}>
            {item.icon ? <SymbolView name={item.icon.symbol} size={ICON_SIZE} tintColor="currentColor"/> : null}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

import type {CSSProperties, ToggleEvent} from 'react';
import type {MenuItem} from './types';
import {useEffect, useRef, useSyncExternalStore} from 'react';
import {useMatchHighlight} from '../a11y/highlight';
import {useRovingFocus} from '../a11y/roving';
import {Icon} from '../symbol';
import {optionId} from './option-id';

const ICON_SIZE = 16;
const VIEWPORT_GAP = 8;

/** Whether the browser lays out `position-anchor` natively (Baseline 2026). */
function anchorPositioning(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('position-anchor', '--ui-menu');
}

/** What a static export's server answers: it has no `CSS` to ask. */
function serverAnchorPositioning(): boolean {
  return false;
}

/** The answer never changes while the page runs, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

/**
 * Whether the browser lays out `position-anchor` natively, asked at render
 * rather than when the module loads. A static export's server has no `CSS`,
 * so its HTML has no anchor, and hydration renders the server's answer to
 * match it; the render right after hydration takes the anchor, which React
 * would not have patched into an attribute that differed.
 */
function useAnchorPositioning(): boolean {
  return useSyncExternalStore(noSubscription, anchorPositioning, serverAnchorPositioning);
}

/** What the page answers once it runs. */
function clientHydrated(): boolean {
  return true;
}

/** What a static export's server answers: nothing runs on its page yet. */
function serverHydrated(): boolean {
  return false;
}

/**
 * Whether the page is running: false in a static export's HTML and in the
 * render that hydrates it, true from the render right after. A trigger
 * that opens a `popover` through its `popovertarget` takes it only then, so
 * a press before the bundle runs opens nothing, rather than a list the
 * browser would open by itself, with no anchor and entries that do nothing
 * yet.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, clientHydrated, serverHydrated);
}

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
  /**
   * The anchor is a point in the content rather than a trigger, so the popup
   * opens from it to the trailing edge instead of aligning its own trailing
   * edge to the trigger's.
   */
  atPoint?: boolean;
  /** Element to measure when the browser lacks CSS anchor positioning. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Fixed viewport position (context menus) instead of an anchor. */
  position?: {x: number; y: number} | null;
  /** Exposes the popover element so callers can `showPopover()` programmatically. */
  popoverRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when the popover opens and closes (light dismiss, Escape, a pick). */
  onOpenChange?: (open: boolean) => void;
  /**
   * What the entries were filtered by, so the matched part of each label can
   * be marked. The filtering itself has already happened by the time the list
   * is handed these items.
   */
  match?: string;
  /** Which side of a point anchor the popup opens on; below unless `top` is asked for. */
  edge?: 'auto' | 'top' | 'bottom';
  /**
   * Whether the popup takes the keyboard focus as it opens. Without it the
   * list is a `listbox` whose current entry is `highlighted`, driven from
   * the field the focus stays in through `aria-activedescendant`.
   * @default true
   */
  focusOnOpen?: boolean;
  /** The entry drawn as the current one in a list that does not take the focus. */
  highlighted?: number;
  /** Called as an entry is picked, before its `onPress`. */
  onPick?: () => void;
}


/**
 * Web `role="menu"` popup shared by `Menu`, `ContextMenu` and `Fab`, rendered
 * as a native `popover="auto"` element. The browser handles the top layer,
 * light dismiss (outside click / Escape) and the trigger's `aria-expanded`;
 * every item carries `popovertargetaction="hide"` so picking one closes the
 * menu declaratively. Placement is CSS anchor positioning (see `menu.css`),
 * with a measured fallback for engines without it.
 */
export function MenuList({id, items, anchor, atPoint, anchorRef, position, popoverRef, onOpenChange, match, edge = 'auto', focusOnOpen = true, highlighted, onPick}: MenuListProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = popoverRef ?? localRef;
  const anchored = !!anchor && !position;
  const positioned = useAnchorPositioning();
  // `role="menu"` promises the menu keyboard pattern: one tab stop on the
  // checked item (or the first), the arrows moving within, and typing jumping
  // to a label. The browser gives the top layer and the light dismiss; this is
  // the half it does not.
  const checked = items.findIndex(item => item.active);
  const roving = useRovingFocus(ref, {activeIndex: checked === -1 ? 0 : checked, typeahead: true});
  // What the search matched, painted in place rather than wrapped in a tag.
  useMatchHighlight(ref, match, '.ui-menu__label');
  // A list the focus stays out of shows its current entry and keeps it in view.
  const listbox = !focusOnOpen;
  useEffect(() => {
    if (!listbox || highlighted === undefined) return;
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({block: 'nearest'});
  }, [listbox, highlighted, ref]);

  const above = atPoint === true && edge === 'top';
  const style: Record<string, string | number> = {};
  if (anchored && positioned) style.positionAnchor = anchor;
  if (position) {
    style.left = position.x;
    style.top = position.y;
  }

  const onToggle = (event: ToggleEvent<HTMLDivElement>) => {
    const popover = event.currentTarget;
    if (event.newState !== 'open') {
      // The browser reports a close in a task of its own, by which time the
      // popup may be open again for the next anchor: that close is over.
      if (popover.matches(':popover-open')) return;
      onOpenChange?.(false);
      return;
    }
    // Fallback placement: below the trigger, right-aligned, kept on screen.
    if (anchored && !positioned && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      popover.style.left = `${Math.max(VIEWPORT_GAP, atPoint ? rect.left : rect.right - popover.offsetWidth)}px`;
      popover.style.top = above ? `${Math.max(VIEWPORT_GAP, rect.top - popover.offsetHeight - 4)}px` : `${rect.bottom + 4}px`;
    }
    // Pointer placement: nudge back inside the viewport.
    if (position) {
      const maxX = window.innerWidth - popover.offsetWidth - VIEWPORT_GAP;
      const maxY = window.innerHeight - popover.offsetHeight - VIEWPORT_GAP;
      popover.style.left = `${Math.max(VIEWPORT_GAP, Math.min(position.x, maxX))}px`;
      popover.style.top = `${Math.max(VIEWPORT_GAP, Math.min(position.y, maxY))}px`;
    }
    if (focusOnOpen) (popover.querySelector('button:not(:disabled)') as HTMLButtonElement | null)?.focus();
    onOpenChange?.(true);
  };

  return (
    <div
      ref={ref}
      id={id}
      role={listbox ? 'listbox' : 'menu'}
      popover="auto"
      className={[
        'ui-menu__list',
        anchored && positioned && 'ui-menu__list--anchored',
        anchored && positioned && atPoint && 'ui-menu__list--point',
        anchored && positioned && above && 'ui-menu__list--above',
      ].filter(Boolean).join(' ')}
      style={style as CSSProperties}
      onToggle={onToggle}
      onKeyDown={listbox ? undefined : roving.onKeyDown}>
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && index > 0 ? <div className="ui-menu__separator" role="separator"/> : null}
          <button
            type="button"
            role={listbox ? 'option' : 'menuitem'}
            aria-current={item.active ? 'true' : undefined}
            className={[
              'ui-menu__item',
              item.role === 'destructive' && 'ui-menu__item--destructive',
              item.active && 'ui-menu__item--active',
              listbox && index === highlighted && 'ui-menu__item--highlighted',
            ].filter(Boolean).join(' ')}
            disabled={item.disabled}
            popoverTarget={id}
            popoverTargetAction="hide"
            {...(listbox ? {id: optionId(id, index), tabIndex: -1, 'aria-selected': index === highlighted} : roving.itemProps(index))}
            onClick={() => {
              onPick?.();
              item.onPress?.();
            }}>
            {item.swatch ? (
              <span className="ui-menu__swatch" style={{background: item.swatch}} aria-hidden="true"/>
            ) : item.icon ? (
              <Icon icon={item.icon} size={ICON_SIZE} tintColor="currentColor"/>
            ) : null}
            <span className="ui-menu__label">{item.label}</span>
            {item.active ? <span className="ui-menu__check" aria-hidden="true">✓</span> : null}
          </button>
        </div>
      ))}
    </div>
  );
}

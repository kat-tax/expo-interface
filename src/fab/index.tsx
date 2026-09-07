import './fab.css';
import type {CSSProperties} from 'react';
import type {FabProps} from './types';
import {useId, useRef} from 'react';
import {Symbol} from '../symbol';
import {MenuList, menuIdent} from '../menu/list';
import {FAB_ICON} from './shared';

/**
 * On web the button is a `<button>` with the Material geometry (a circle or
 * an extended capsule, filled with the tint) styled via `fab.css`. With
 * `items` it carries a `popovertarget` to the kit's popup menu, the same
 * `MenuList` the `Menu` opens, anchored above the button by CSS anchor
 * positioning. Where it floats is the screen's job (`Screen`'s `fab` slot).
 */
export function Fab({label, icon, onPress, items, size = 'regular', shape = 'rounded', disabled, onOpenChange, testID}: FabProps) {
  const ident = menuIdent(useId());
  const anchor = `--${ident}`;
  const wrapper = useRef<HTMLSpanElement>(null);
  const extended = size === 'extended';
  return (
    <span ref={wrapper} className="ui-fab__anchor" style={{anchorName: anchor} as CSSProperties}>
      <button
        type="button"
        className={`ui-fab ui-fab--${size} ui-fab--${shape}`}
        aria-label={extended ? undefined : label}
        disabled={disabled}
        onClick={items ? undefined : onPress}
        popoverTarget={items ? ident : undefined}
        data-testid={testID}>
        <Symbol icon={icon} size={FAB_ICON[size]} tintColor="currentColor"/>
        {extended ? <span className="ui-fab__label">{label}</span> : null}
      </button>
      {items ? <MenuList id={ident} items={items} anchor={anchor} anchorRef={wrapper} onOpenChange={onOpenChange}/> : null}
    </span>
  );
}

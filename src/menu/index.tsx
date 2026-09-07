import './menu.css';
import type {CSSProperties} from 'react';
import type {MenuProps} from './types';
import {useId, useRef} from 'react';
import {SymbolView} from 'expo-symbols';
import {Button} from '../button';
import {SIZE_ICON} from '../button/shared';
import {MenuList, menuIdent} from './list';

/**
 * On web the trigger is the kit's `<button>` (or, with `trigger="link"`, a
 * text link like the tab bar's tabs) with a `popovertarget` pointing at the
 * entries' native `popover`, so opening, closing, light dismiss and
 * `aria-expanded` are all handled by the browser. The wrapper carries the
 * `anchor-name` that CSS anchor positioning places the popup against.
 */
export function Menu({label, icon, items, trigger = 'button', testID, ...button}: MenuProps) {
  const ident = menuIdent(useId());
  const anchor = `--${ident}`;
  const wrapper = useRef<HTMLSpanElement>(null);
  return (
    <span ref={wrapper} className="ui-menu" style={{anchorName: anchor} as CSSProperties}>
      {trigger === 'link' ? (
        <button
          type="button"
          className="ui-menu__link"
          disabled={button.disabled}
          popoverTarget={ident}
          data-testid={testID}
          aria-label={button.hideLabel ? label : undefined}>
          {icon ? <SymbolView name={icon.symbol} size={SIZE_ICON[button.size ?? 'medium']} tintColor="currentColor"/> : null}
          {button.hideLabel ? null : <span>{label}</span>}
        </button>
      ) : (
        <Button
          {...button}
          label={label}
          prefixIcon={icon}
          popoverTarget={ident}
          testID={testID}
        />
      )}
      <MenuList id={ident} items={items} anchor={anchor} anchorRef={wrapper}/>
    </span>
  );
}

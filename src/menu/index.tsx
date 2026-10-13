import './menu.css';
import type {CSSProperties} from 'react';
import type {MenuProps} from './types';
import {useRef} from 'react';
import {Icon} from '../symbol';
import {Button} from '../button';
import {SIZE_ICON} from '../button/shared';
import {MenuList, useMenuIdent} from './list';

/**
 * On web the trigger is the kit's `<button>` (or, with `trigger="link"`, a
 * text link like the tab bar's tabs) with a `popovertarget` pointing at the
 * entries' native `popover`, so opening, closing, light dismiss and
 * `aria-expanded` are all handled by the browser. The popup's id, the
 * trigger's `popovertarget`, the wrapper's `anchor-name` that CSS anchor
 * positioning places the popup against and the popup's `position-anchor`
 * are written together once the page has hydrated (`useMenuIdent`): a
 * static export's HTML carries none of them, so a press before the bundle
 * runs opens nothing, and the trigger never names a list the server's ids
 * gave another name. A trigger that is `pressed` is `aria-pressed` on
 * either, and the kit's button draws it filled.
 */
export function Menu({label, icon, items, trigger = 'button', onOpenChange, material, testID, ...button}: MenuProps) {
  const {ident, anchor} = useMenuIdent();
  const wrapper = useRef<HTMLSpanElement>(null);
  return (
    <span ref={wrapper} className="ui-menu" style={{anchorName: anchor} as CSSProperties}>
      {trigger === 'link' ? (
        <button
          type="button"
          className="ui-menu__link"
          disabled={button.disabled}
          aria-pressed={button.pressed}
          popoverTarget={ident}
          data-testid={testID}
          aria-label={button.hideLabel ? label : undefined}>
          {icon ? <Icon icon={icon} size={button.iconSize ?? SIZE_ICON[button.size ?? 'medium']} tintColor="currentColor"/> : null}
          {button.hideLabel ? null : <span className="ui-menu__label">{label}</span>}
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
      <MenuList id={ident} items={items} anchor={anchor} anchorRef={wrapper} onOpenChange={onOpenChange} material={material}/>
    </span>
  );
}

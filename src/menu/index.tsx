import './menu.css';
import type {CSSProperties} from 'react';
import type {MenuProps} from './types';
import {useId, useRef} from 'react';
import {Icon} from '../symbol';
import {Button} from '../button';
import {SIZE_ICON} from '../button/shared';
import {MenuList, menuIdent, useHydrated} from './list';

/**
 * On web the trigger is the kit's `<button>` (or, with `trigger="link"`, a
 * text link like the tab bar's tabs) with a `popovertarget` pointing at the
 * entries' native `popover`, so opening, closing, light dismiss and
 * `aria-expanded` are all handled by the browser. The trigger takes the
 * `popovertarget` once the page has hydrated: a static export's HTML has
 * none, so a press before the bundle runs opens nothing. The wrapper carries
 * the `anchor-name` that CSS anchor positioning places the popup against.
 */
export function Menu({label, icon, items, trigger = 'button', onOpenChange, testID, ...button}: MenuProps) {
  const ident = menuIdent(useId());
  const anchor = `--${ident}`;
  const wrapper = useRef<HTMLSpanElement>(null);
  const hydrated = useHydrated();
  return (
    <span ref={wrapper} className="ui-menu" style={{anchorName: anchor} as CSSProperties}>
      {trigger === 'link' ? (
        <button
          type="button"
          className="ui-menu__link"
          disabled={button.disabled}
          popoverTarget={hydrated ? ident : undefined}
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
          popoverTarget={hydrated ? ident : undefined}
          testID={testID}
        />
      )}
      <MenuList id={ident} items={items} anchor={anchor} anchorRef={wrapper} onOpenChange={onOpenChange}/>
    </span>
  );
}

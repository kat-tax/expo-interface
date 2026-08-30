import './menu.css';
import type {CSSProperties} from 'react';
import type {MenuProps} from './types';
import {useId, useRef} from 'react';
import {Button} from '../button';
import {MenuList, menuIdent} from './list';

/**
 * On web the trigger is the kit's `<button>` with a `popovertarget` pointing
 * at the entries' native `popover`, so opening, closing, light dismiss and
 * `aria-expanded` are all handled by the browser. The wrapper carries the
 * `anchor-name` that CSS anchor positioning places the popup against.
 */
export function Menu({label, icon, items, testID, ...button}: MenuProps) {
  const ident = menuIdent(useId());
  const anchor = `--${ident}`;
  const wrapper = useRef<HTMLSpanElement>(null);
  return (
    <span ref={wrapper} className="ui-menu" style={{anchorName: anchor} as CSSProperties}>
      <Button
        {...button}
        label={label}
        prefixIcon={icon}
        popoverTarget={ident}
        testID={testID}
      />
      <MenuList id={ident} items={items} anchor={anchor} anchorRef={wrapper}/>
    </span>
  );
}

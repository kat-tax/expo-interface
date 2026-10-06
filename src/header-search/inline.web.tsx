import './header-search.css';
import type {SearchFieldProps} from '../search-field/types';
import {useImperativeHandle, useRef} from 'react';
import {SEARCH_LABEL} from '../search-field/shared';
import {Icon} from '../symbol';
import {INLINE_MIN_WIDTH, INLINE_WIDTH, SEARCH_ICON} from './shared';

/**
 * Web: the field beside the title, frameless. The magnifier and the
 * placeholder sit on the bar's own fill with no border, box or fill of their
 * own, the way a site's search sits by its logo: the bar is the frame. It is
 * still the browser's search input, so the engine's clear button stays, and
 * the focus shows as the kit's inputs show it. It takes the row's spare
 * width up to a desktop search box's and shrinks with the row down to a
 * short field, so it stays in the bar at every width.
 */
export function InlineField({value, placeholder, autoFocus, autoCapitalize, onChangeText, onSubmit, onFocus, onBlur, onKeyPress, ref, testID}: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const label = placeholder ?? SEARCH_LABEL;
  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    blur: () => input.current?.blur(),
  }));
  return (
    <div className="ui-header-search" style={{minWidth: INLINE_MIN_WIDTH, maxWidth: INLINE_WIDTH}} data-testid={testID ? `${testID}-row` : undefined}>
      <Icon icon={SEARCH_ICON} size={18}/>
      <input
        ref={input}
        type="search"
        className="ui-header-search__input"
        value={value}
        placeholder={label}
        aria-label={label}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        enterKeyHint="search"
        data-testid={testID}
        onChange={event => onChangeText(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={event => {
          onKeyPress?.(event.key);
          if (event.key === 'Enter') onSubmit?.(event.currentTarget.value);
        }}
      />
    </div>
  );
}

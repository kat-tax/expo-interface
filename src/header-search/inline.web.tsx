import './header-search.css';
import type {InlineFieldProps} from './shared';
import {useImperativeHandle, useRef, useState} from 'react';
import {SEARCH_LABEL} from '../search-field/shared';
import {useNarrowBar} from '../tabs/context';
import {INLINE_MIN_WIDTH, INLINE_WIDTH} from './shared';

/**
 * Web: the field beside the title, frameless. The placeholder sits on the
 * bar's own fill with no glyph, border, box or fill of its own, the way a
 * site's search sits by its logo: the bar is the frame, and the placeholder
 * is the affordance. Focus shows as the caret and the typed text, with no
 * ring: a search input matches `:focus-visible` on a click too, which would
 * draw a box around a field whose point is that it has none. A focus that
 * came from the keyboard rather than a pointer draws a hairline under the
 * field in the tint, which is not a frame. It is still the browser's search
 * input, so the engine's clear button stays. It takes the row's spare width
 * up to a desktop search box's and shrinks with the row down to a short
 * field, where a narrow bar shows the short placeholder.
 */
export function InlineField({value, placeholder, shortPlaceholder, autoFocus, autoCapitalize, onChangeText, onSubmit, onFocus, onBlur, onKeyPress, ref, testID}: InlineFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  // Whether a pointer is pressing the field, so the focus it gives is not the keyboard's.
  const pointer = useRef(false);
  const [keyboard, setKeyboard] = useState(false);
  const narrow = useNarrowBar();
  const label = placeholder ?? SEARCH_LABEL;
  const shown = narrow && shortPlaceholder ? shortPlaceholder : label;
  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    blur: () => input.current?.blur(),
  }));
  return (
    <div
      className={keyboard ? 'ui-header-search ui-header-search--keyboard' : 'ui-header-search'}
      style={{minWidth: INLINE_MIN_WIDTH, maxWidth: INLINE_WIDTH}}
      data-testid={testID ? `${testID}-row` : undefined}>
      <input
        ref={input}
        type="search"
        className="ui-header-search__input"
        value={value}
        placeholder={shown}
        aria-label={label}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        enterKeyHint="search"
        data-testid={testID}
        onChange={event => onChangeText(event.target.value)}
        onPointerDown={() => {
          pointer.current = true;
        }}
        onFocus={() => {
          setKeyboard(!pointer.current);
          pointer.current = false;
          onFocus?.();
        }}
        onBlur={() => {
          setKeyboard(false);
          onBlur?.();
        }}
        onKeyDown={event => {
          onKeyPress?.(event.key);
          if (event.key === 'Enter') onSubmit?.(event.currentTarget.value);
        }}
      />
    </div>
  );
}

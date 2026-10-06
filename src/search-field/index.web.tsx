import './search-field.css';
import type {CSSProperties} from 'react';
import type {SearchFieldProps} from './types';
import {useId, useImperativeHandle, useRef} from 'react';
import {StyleSheet, type TextStyle} from 'react-native';
import {flatten} from '../theme';
import {SEARCH_LABEL} from './shared';

/**
 * On web the field is `<input type="search">` with a `<datalist>`.
 *
 * That is the browser's own combobox, which means the hardest keyboard
 * pattern in the APG — `aria-expanded`, `aria-activedescendant`,
 * `aria-autocomplete` and the arrow handling behind them — is the platform's
 * problem rather than the kit's. The same reasoning made `Picker` a `<select>`
 * and `Alert` a `<dialog>`, and it is why this component needed no dependency.
 *
 * The cost, stated plainly: a `<datalist>` entry is text and nothing else, so
 * a suggestion cannot carry an icon, and the list is drawn by the browser
 * rather than by the kit. `type="search"` also brings the engine's own clear
 * button, which is why `clearable` draws none of its own here.
 */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  suggestions,
  disabled,
  autoFocus,
  autoCapitalize,
  onFocus,
  onBlur,
  onKeyPress,
  ref,
  testID,
  style,
}: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const list = `ui-search-${useId().replaceAll(/[^A-Za-z0-9_-]/g, '_')}`;
  const label = placeholder ?? SEARCH_LABEL;
  const vars = flatten(StyleSheet.flatten(style) as TextStyle) as CSSProperties;
  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    blur: () => input.current?.blur(),
  }));
  return (
    <div className="ui-search" style={vars} data-testid={testID ? `${testID}-row` : undefined}>
      <input
        ref={input}
        type="search"
        className="ui-search__input"
        // The browser draws the list, and knows how to reach it from the
        // keyboard; the kit only says what is in it.
        list={suggestions && suggestions.length > 0 ? list : undefined}
        value={value}
        placeholder={label}
        aria-label={label}
        disabled={disabled}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        // `search` in the enter-key hint, which phones honour.
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
      {suggestions && suggestions.length > 0 ? (
        <datalist id={list}>
          {suggestions.map(suggestion => <option key={suggestion} value={suggestion}/>)}
        </datalist>
      ) : null}
    </div>
  );
}

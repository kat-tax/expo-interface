import './chip.css';
import type {ChipProps} from './types';
import {Icon} from '../symbol';
import {chipKind, nextSelected} from './shared';

/** The size a chip's icon takes beside a 14px label. */
const ICON = 16;

/**
 * On web a chip is a `<button>`, and a chip that can be off is one with
 * `aria-pressed` — the toggle-button pattern, which is what the APG calls a
 * button whose state persists. `aria-pressed` and nothing else: a screen
 * reader then says "pressed" or "not pressed" without the kit inventing a
 * word for it.
 */
export function Chip(props: ChipProps) {
  const {label, onPress, selected, icon, disabled, testID} = props;
  const filter = chipKind(props) === 'filter';
  return (
    <button
      type="button"
      className={['ui-chip', selected && 'ui-chip--on'].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-pressed={filter ? selected : undefined}
      data-testid={testID}
      onClick={() => onPress?.(nextSelected(props))}>
      {icon ? <Icon icon={icon} size={ICON}/> : null}
      <span className="ui-chip__label">{label}</span>
    </button>
  );
}

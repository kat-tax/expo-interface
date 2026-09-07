import './icon-toggle.css';
import type {CSSProperties} from 'react';
import type {IconToggleProps} from './types';
import {SymbolView} from 'expo-symbols';
import {useColor} from '../theme';

/**
 * On web the toggle is a `<button aria-pressed>` — the role screen readers
 * announce as on or off — with the icon swapped for the state.
 */
export function IconToggle({
  label,
  icon,
  activeIcon,
  value,
  onValueChange,
  color,
  offColor,
  size = 24,
  disabled = false,
  testID,
}: IconToggleProps) {
  const tint = useColor('tint');
  const secondary = useColor('secondaryLabel');
  const on = color ?? tint;
  const off = offColor ?? secondary;
  return (
    <button
      type="button"
      className="ui-icon-toggle"
      style={{'--ui-icon-toggle-size': `${size}px`} as CSSProperties}
      aria-label={label}
      aria-pressed={value}
      disabled={disabled}
      onClick={() => onValueChange(!value)}
      data-testid={testID}>
      <SymbolView
        name={(value ? activeIcon ?? icon : icon).symbol}
        size={size}
        tintColor={value ? on : off}
      />
    </button>
  );
}

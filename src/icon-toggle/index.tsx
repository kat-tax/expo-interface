import './icon-toggle.css';
import type {CSSProperties} from 'react';
import type {IconToggleProps} from './types';
import {Icon} from '../symbol';
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
  variant = 'plain',
  color,
  offColor,
  size = 24,
  disabled = false,
  offVisibility = 'visible',
  testID,
}: IconToggleProps) {
  const tint = useColor('tint');
  const secondary = useColor('secondaryLabel');
  const on = color ?? tint;
  const off = offColor ?? secondary;
  const classes = ['ui-icon-toggle'];
  if (variant === 'tonal') classes.push('ui-icon-toggle--tonal');
  // `visibility: hidden` keeps the box and takes the button out of the
  // accessibility tree and the tab order at once.
  if (offVisibility === 'hidden' && !value) classes.push('ui-icon-toggle--hidden');
  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={{'--ui-icon-toggle-size': `${size}px`} as CSSProperties}
      aria-label={label}
      aria-pressed={value}
      disabled={disabled}
      onClick={() => onValueChange(!value)}
      data-testid={testID}>
      <Icon
        icon={value ? activeIcon ?? icon : icon}
        size={size}
        tintColor={value ? on : off}
      />
    </button>
  );
}

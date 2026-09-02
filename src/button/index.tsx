import './button.css';
import type {CSSProperties} from 'react';
import type {ButtonProps} from './types';
import {SymbolView} from 'expo-symbols';
import {onAccent as contrastOf} from '../accent';
import {useColor} from '../theme';
import {SIZE_ICON} from './shared';

/** Web-only additions: hook the button up to a native `popover` element. */
interface WebButtonProps extends ButtonProps {
  /**
   * `id` of a `[popover]` element this button toggles (the `popovertarget`
   * attribute). The browser then manages open/close, `aria-expanded` and
   * light-dismiss without JavaScript.
   */
  popoverTarget?: string;
  /** @default 'toggle' */
  popoverTargetAction?: 'toggle' | 'show' | 'hide';
}

/**
 * On web the button is a real `<button>` element styled via `button.css`, so it
 * reads as a native web control rather than a ported Android/Material button.
 * The accent color is passed through the `--ui-button-accent` custom property.
 */
export function Button({
  label,
  onPress,
  variant = 'filled',
  role = 'default',
  size = 'medium',
  color,
  shape,
  prefixIcon,
  suffixIcon,
  hideLabel = false,
  disabled = false,
  fillWidth = false,
  testID,
  popoverTarget,
  popoverTargetAction,
}: WebButtonProps) {
  const themeTint = useColor('tint');
  const destructive = useColor('destructive');
  const themeOnAccent = useColor(role === 'destructive' ? 'onDestructive' : 'onTint');
  const accent = color ?? (role === 'destructive' ? destructive : themeTint);
  // A custom accent brings its own contrast color for filled content.
  const onAccent = color ? contrastOf(color) : themeOnAccent;
  const iconOnly = hideLabel && !!prefixIcon;
  const iconSize = SIZE_ICON[size];
  const style = color
    ? ({'--ui-button-accent': color, '--ui-button-on-accent': onAccent} as CSSProperties)
    : undefined;
  const className = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    shape && `ui-button--${shape}`,
    !shape && 'ui-button--pill',
    iconOnly && 'ui-button--icon-only',
    role === 'destructive' && 'ui-button--destructive',
    fillWidth && 'ui-button--fill',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      style={style}
      className={className}
      disabled={disabled}
      onClick={onPress}
      popoverTarget={popoverTarget}
      popoverTargetAction={popoverTarget ? popoverTargetAction : undefined}
      data-testid={testID}
      aria-label={iconOnly ? label : undefined}>
      {prefixIcon ? (
        <SymbolView
          name={prefixIcon.symbol}
          size={iconSize}
          tintColor={variant === 'filled' ? onAccent : accent}
        />
      ) : null}
      {!iconOnly ? <span className="ui-button__label">{label}</span> : null}
      {suffixIcon && !iconOnly ? (
        <SymbolView
          name={suffixIcon.symbol}
          size={iconSize}
          tintColor={variant === 'filled' ? onAccent : accent}
        />
      ) : null}
    </button>
  );
}

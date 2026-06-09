import './button.css';
import type {CSSProperties} from 'react';
import type {ButtonProps} from './types';
import {SymbolView} from 'expo-symbols';
import {useColor} from '@/ui/theme';
import {DESTRUCTIVE, SIZE_ICON} from './shared';

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
  testID,
}: ButtonProps) {
  const themeTint = useColor('tint');
  const accent = color ?? (role === 'destructive' ? DESTRUCTIVE : themeTint);
  const iconOnly = hideLabel && !!prefixIcon;
  const iconSize = SIZE_ICON[size];
  const style = color ? ({'--ui-button-accent': color} as CSSProperties) : undefined;
  const className = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    shape && `ui-button--${shape}`,
    !shape && 'ui-button--pill',
    iconOnly && 'ui-button--icon-only',
    role === 'destructive' && 'ui-button--destructive',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      style={style}
      className={className}
      disabled={disabled}
      onClick={onPress}
      data-testid={testID}
      aria-label={iconOnly ? label : undefined}>
      {prefixIcon ? (
        <SymbolView
          name={prefixIcon.symbol}
          size={iconSize}
          tintColor={variant === 'filled' ? '#ffffff' : accent}
        />
      ) : null}
      {!iconOnly ? <span className="ui-button__label">{label}</span> : null}
      {suffixIcon && !iconOnly ? (
        <SymbolView
          name={suffixIcon.symbol}
          size={iconSize}
          tintColor={variant === 'filled' ? '#ffffff' : accent}
        />
      ) : null}
    </button>
  );
}

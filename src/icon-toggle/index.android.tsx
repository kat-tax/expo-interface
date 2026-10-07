import type {IconToggleProps} from './types';
import {Icon, IconToggleButton} from '@expo/ui/jetpack-compose';
import {alpha, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {SelfHosted} from '../host';
import {drawableOf} from '../icons';
import {useColor} from '../theme';

/**
 * Android renders the Material 3 `IconToggleButton`, which carries the
 * checked state into the semantics tree (and so into TalkBack) and gives the
 * press its ripple. In a host of its own where there is none above it, so
 * the toggle can sit in a React Native layout.
 */
export function IconToggle(props: IconToggleProps) {
  return (
    <SelfHosted>
      <NativeIconToggle {...props}/>
    </SelfHosted>
  );
}

function NativeIconToggle({
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
  const shown = drawableOf(value ? activeIcon ?? icon : icon);
  const modifiers = [];
  if (disabled) modifiers.push(alpha(0.4));
  if (testID) modifiers.push(testIDModifier(testID));
  return (
    <IconToggleButton
      checked={value}
      enabled={!disabled}
      onCheckedChange={onValueChange}
      colors={{contentColor: offColor ?? secondary, checkedContentColor: color ?? tint}}
      modifiers={modifiers}>
      {shown ? (
        <Icon source={shown} size={size} tint={value ? color ?? tint : offColor ?? secondary} contentDescription={label}/>
      ) : null}
    </IconToggleButton>
  );
}

import type {IconToggleProps} from './types';
import {FilledIconToggleButton, Icon, IconToggleButton, useMaterialColors} from '@expo/ui/jetpack-compose';
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
  const palette = useMaterialColors();
  const shown = drawableOf(value ? activeIcon ?? icon : icon);
  // Nothing in `@expo/ui`'s modifiers hides a control from TalkBack while it
  // is drawn invisibly, so an off toggle that is hidden is left out.
  if (offVisibility === 'hidden' && !value) return null;
  const modifiers = [];
  if (disabled) modifiers.push(alpha(0.4));
  if (testID) modifiers.push(testIDModifier(testID));
  // The tonal toggle is Material's filled tonal icon button: the filled
  // toggle in the tonal roles of the host's palette, its icon in the content
  // color of each container unless the two colors say otherwise.
  const tonal = variant === 'tonal';
  const on = color ?? (tonal ? palette.onSecondaryContainer : tint);
  const off = offColor ?? (tonal ? palette.onSurfaceVariant : secondary);
  const Toggle = tonal ? FilledIconToggleButton : IconToggleButton;
  const colors = tonal
    ? {containerColor: palette.surfaceContainerHighest, contentColor: off, checkedContainerColor: palette.secondaryContainer, checkedContentColor: on}
    : {contentColor: off, checkedContentColor: on};
  return (
    <Toggle
      checked={value}
      enabled={!disabled}
      onCheckedChange={onValueChange}
      colors={colors}
      modifiers={modifiers}>
      {shown ? (
        <Icon source={shown} size={size} tint={value ? on : off} contentDescription={label}/>
      ) : null}
    </Toggle>
  );
}

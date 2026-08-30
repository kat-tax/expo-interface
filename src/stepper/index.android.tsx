import type {StepperProps} from './types';

import add from '@expo/material-symbols/add.xml';
import remove from '@expo/material-symbols/remove.xml';
import {Icon, OutlinedIconButton, Row, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';
import {clampStep, stepBounds} from './shared';

const BUTTON = 36;
const ICON = 18;

/**
 * Jetpack Compose has no stepper control, so Android composes one from two
 * Material 3 `OutlinedIconButton`s tinted with the live accent, with the
 * value shown beside them. The row fills the available width and pins the
 * control to the trailing edge, mirroring the iOS Form row.
 */
export function Stepper(props: StepperProps) {
  const {label, value, onValueChange, step = 1, min, max, formatValue, disabled, testID} = props;
  const colors = useMaterialColors();
  const tint = useColor('tint');
  const {canDecrement, canIncrement} = stepBounds(props);
  const buttonColors = {
    contentColor: tint,
    disabledContentColor: colors.onSurfaceVariant,
  };

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
      modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
      {label != null ? (
        <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      ) : null}
      <Row verticalAlignment="center" horizontalArrangement={{spacedBy: 8}}>
        <Text color={colors.onSurfaceVariant}>
          {formatValue ? formatValue(value) : String(value)}
        </Text>
        <OutlinedIconButton
          enabled={canDecrement}
          colors={buttonColors}
          onClick={canDecrement ? () => onValueChange(clampStep(value - step, min, max)) : undefined}
          modifiers={[size(BUTTON, BUTTON)]}>
          <Icon source={remove} size={ICON} contentDescription="Decrement"/>
        </OutlinedIconButton>
        <OutlinedIconButton
          enabled={canIncrement}
          colors={buttonColors}
          onClick={canIncrement ? () => onValueChange(clampStep(value + step, min, max)) : undefined}
          modifiers={[size(BUTTON, BUTTON)]}>
          <Icon source={add} size={ICON} contentDescription="Increment"/>
        </OutlinedIconButton>
      </Row>
    </Row>
  );
}

import type {PickerValue} from '../picker/types';
import type {SegmentedControlProps} from './types';

import {Row, SegmentedButton, SingleChoiceSegmentedButtonRow, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {onAccent} from '../accent';
import {useColor} from '../theme';
import {extractItems, PickerItem, useSelectedValue} from '../picker/shared';

/**
 * Android renders the Material 3 `SingleChoiceSegmentedButtonRow`. The
 * selected segment is filled with the live accent seed (matching the iOS
 * tint cascade and the web accent) and the row pins the control to the
 * trailing edge, mirroring the iOS Form row.
 */
function SegmentedControlComponent<T extends PickerValue>({
  label,
  children,
  selectedValue,
  onValueChange,
  disabled,
  accentColor,
  testID,
}: SegmentedControlProps<T>) {
  const colors = useMaterialColors();
  const tint = useColor('tint');
  const accent = accentColor ?? tint;
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const segmentColors = {
    activeContainerColor: accent,
    activeContentColor: onAccent(accent),
    activeBorderColor: colors.outline,
    inactiveContainerColor: '#00000000',
    inactiveContentColor: colors.onSurface,
    inactiveBorderColor: colors.outline,
  };

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
      modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
      {label != null ? (
        <Text color={disabled ? colors.onSurfaceVariant : colors.onSurface}>{label}</Text>
      ) : null}
      <SingleChoiceSegmentedButtonRow>
        {items.map(item => (
          <SegmentedButton
            key={String(item.value)}
            selected={item.value === current}
            enabled={!disabled}
            colors={segmentColors}
            onClick={disabled ? undefined : () => setValue(item.value)}>
            <SegmentedButton.Label>
              <Text>{item.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Row>
  );
}

SegmentedControlComponent.Item = PickerItem;

export {SegmentedControlComponent as SegmentedControl};

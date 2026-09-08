import type {PickerValue} from '../picker/types';
import type {SegmentedControlProps} from './types';

import {Box, Row, Text} from '@expo/ui/jetpack-compose';
import {
  alpha,
  background,
  clip,
  defaultMinSize,
  dropShadow,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  selectable,
  selectableGroup,
  Shapes,
  testID as testIDModifier,
} from '@expo/ui/jetpack-compose/modifiers';
import {onAccent} from '../accent';
import {useColor} from '../theme';
import {metrics, TRACK_INSET} from './shared';
import {extractItems, PickerItem, useSelectedValue} from '../picker/shared';

/**
 * Android composes the iOS segmented control out of Compose primitives: a
 * `pillBackground` track clipped to the shape, holding one selectable `Box`
 * per segment with the raised fill on the selected one.
 *
 * Material's own `SingleChoiceSegmentedButtonRow` is deliberately not used —
 * it hardcodes `SegmentedButtonDefaults.itemShape` and a 40dp height (so
 * neither `shape` nor `size` can reach it) and stamps a checkmark into the
 * selected segment, none of which the other two platforms do. The row still
 * pins the control to the trailing edge, mirroring the iOS Form row.
 */
function SegmentedControlComponent<T extends PickerValue>({
  label,
  children,
  selectedValue,
  onValueChange,
  disabled,
  accentColor,
  size = 'medium',
  shape = 'rounded',
  testID,
}: SegmentedControlProps<T>) {
  const labelColor = useColor('label');
  const track = useColor('pillBackground');
  const raised = useColor('segmentSelected');
  const fill = accentColor ?? raised;
  // An accent brings its own contrast color; the neutral fill keeps the label.
  const onFill = accentColor ? onAccent(accentColor) : labelColor;
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const m = metrics(size, shape);
  const trackShape = Shapes.RoundedCorner(m.radius);
  const segmentShape = Shapes.RoundedCorner(m.segmentRadius);

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement="spaceBetween"
      modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
      {label != null ? <Text color={labelColor}>{label}</Text> : null}
      <Row
        verticalAlignment="center"
        modifiers={[
          ...(disabled ? [alpha(0.4)] : []),
          clip(trackShape),
          background(track),
          paddingAll(TRACK_INSET),
          selectableGroup(),
        ]}>
        {items.map(item => {
          const selected = item.value === current;
          return (
            <Box
              key={String(item.value)}
              contentAlignment="center"
              modifiers={[
                height(m.segmentHeight),
                defaultMinSize({minWidth: m.minWidth}),
                // Drawn before the clip so the raised segment casts the same
                // soft shadow the iOS indicator does; `padding` comes after
                // `selectable` so the whole segment is the touch target.
                ...(selected ? [
                  dropShadow(segmentShape, {radius: 3, offsetY: 1, alpha: 0.12}),
                  clip(segmentShape),
                  background(fill),
                ] : [clip(segmentShape)]),
                ...(disabled ? [] : [selectable(selected, () => setValue(item.value), 'radioButton')]),
                padding(m.padding, 0, m.padding, 0),
              ]}>
              <Text color={selected ? onFill : labelColor} style={{fontSize: m.fontSize}}>
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Row>
    </Row>
  );
}

SegmentedControlComponent.Item = PickerItem;

export {SegmentedControlComponent as SegmentedControl};

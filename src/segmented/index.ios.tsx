import type {PickerValue} from '../picker/types';
import type {SegmentedControlProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Picker as SwiftUIPicker, Text} from '@expo/ui/swift-ui';
import {clipShape, controlSize, pickerStyle, tag, tint, disabled as disabledMod} from '@expo/ui/swift-ui/modifiers';
import {swiftControlSize} from './shared';
import {extractItems, PickerItem, useSelectedValue} from '../picker/shared';

/**
 * iOS renders SwiftUI's `Picker` in the `segmented` style — the system
 * `UISegmentedControl`, which is the reference the web and Android controls
 * are drawn to match — with the label leading inside a Form row. Drop it
 * straight into a `FieldGroup.Section`.
 *
 * `size` maps to `controlSize`; `shape` only clips, and only for `pill`, since
 * `rounded` already *is* the system corner and clipping it again would fight
 * the control's own rounding.
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
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const modifiers: ViewModifier[] = [pickerStyle('segmented'), controlSize(swiftControlSize(size))];
  if (shape === 'pill') modifiers.push(clipShape('capsule'));
  if (accentColor) modifiers.push(tint(accentColor));
  if (disabled) modifiers.push(disabledMod(true));

  return (
    <SwiftUIPicker
      label={label}
      selection={current}
      onSelectionChange={value => setValue(value as T)}
      modifiers={modifiers}
      testID={testID}>
      {items.map(item => (
        <Text key={String(item.value)} modifiers={[tag(item.value)]}>
          {item.label}
        </Text>
      ))}
    </SwiftUIPicker>
  );
}

SegmentedControlComponent.Item = PickerItem;

export {SegmentedControlComponent as SegmentedControl};

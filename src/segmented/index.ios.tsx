import type {PickerValue} from '../picker/types';
import type {SegmentedControlProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Picker as SwiftUIPicker, Text} from '@expo/ui/swift-ui';
import {pickerStyle, tag, tint, disabled as disabledMod} from '@expo/ui/swift-ui/modifiers';
import {extractItems, PickerItem, useSelectedValue} from '../picker/shared';

/**
 * iOS renders SwiftUI's `Picker` in the `segmented` style — the system
 * `UISegmentedControl` — with the label leading inside a Form row. Drop it
 * straight into a `FieldGroup.Section`.
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
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const modifiers: ViewModifier[] = [pickerStyle('segmented')];
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

import type {PickerProps, PickerValue} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Picker as SwiftUIPicker, Text} from '@expo/ui/swift-ui';
import {pickerStyle, tag, tint, disabled as disabledMod} from '@expo/ui/swift-ui/modifiers';
import {extractItems, PickerItem, useSelectedValue} from './shared';

export * from './types';

/**
 * iOS renders the picker inline using SwiftUI's `Picker` with the `menu` style,
 * which is the rounded-pill Form row look the other platforms emulate: a
 * leading label, the selected value, and a trailing chevron. Drop it straight
 * into a `FieldGroup.Section` alongside other rows.
 */
function PickerComponent<T extends PickerValue>({
  label,
  selectedValue,
  onValueChange,
  disabled,
  accentColor,
  children,
  testID,
}: PickerProps<T>) {
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const modifiers: ViewModifier[] = [pickerStyle('menu')];

  if (accentColor) modifiers.push(tint(accentColor));
  if (disabled != null) modifiers.push(disabledMod(disabled));

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

PickerComponent.Item = PickerItem;

export {PickerComponent as Picker};

import type {PickerProps, PickerValue} from './types';
import {StyleSheet, View} from 'react-native';
import XamlComboBox from '../windows/specs/ExpoInterfaceComboBoxNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {Label} from '../typography';
import {extractItems, PickerItem, useSelectedValue} from './shared';

/**
 * Windows renders a WinUI 3 `ComboBox` in a XAML island at the trailing edge
 * of a row whose label the kit draws. The options cross as their labels and
 * the pick comes back by index, so a value of any type maps straight back.
 */
function PickerComponent<T extends PickerValue>({
  style,
  label,
  testID,
  children,
  disabled,
  accentColor,
  selectedValue,
  onValueChange,
}: PickerProps<T>) {
  const xaml = useXamlProps();
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const selectedIndex = items.findIndex(item => item.value === current);
  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <XamlComboBox
        options={jsonProp(items.map(item => item.label))}
        selectedIndex={selectedIndex}
        disabled={disabled}
        label={label}
        onSelectionChange={event => {
          const item = items[event.nativeEvent.index];
          if (item) setValue(item.value);
        }}
        {...xaml}
        accentColor={accentColor ?? xaml.accentColor}
      />
    </View>
  );
}

PickerComponent.Item = PickerItem;

export {PickerComponent as Picker};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  label: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.4,
  },
});

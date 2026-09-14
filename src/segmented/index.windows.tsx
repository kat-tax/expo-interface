import type {PickerValue} from '../picker/types';
import type {SegmentedControlProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlSelectorBar from '../windows/specs/ExpoInterfaceSelectorBarNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {Label} from '../typography';
import {extractItems, PickerItem, useSelectedValue} from '../picker/shared';

/**
 * Windows renders a WinUI 3 `SelectorBar` in a XAML island — Fluent's
 * segmented control, a row of items with an accent underline on the
 * selected one — at the trailing edge of a row whose label the kit draws.
 * The control has one size and one shape, so `size` and `shape` are not
 * applied; `accentColor` colors the indicator.
 */
function SegmentedControlComponent<T extends PickerValue>({
  label,
  children,
  selectedValue,
  onValueChange,
  disabled,
  accentColor,
  testID,
  style,
}: SegmentedControlProps<T>) {
  const xaml = useXamlProps();
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const selectedIndex = Math.max(0, items.findIndex(item => item.value === current));
  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <XamlSelectorBar
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

SegmentedControlComponent.Item = PickerItem;

export {SegmentedControlComponent as SegmentedControl};

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

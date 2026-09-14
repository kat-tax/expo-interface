import type {SliderProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlSlider from '../windows/specs/ExpoInterfaceSliderNativeComponent';
import {useXamlProps} from '../windows';
import {Label} from '../typography';

/**
 * Windows renders a WinUI 3 `Slider` in a XAML island, filling the width the
 * row's label leaves it. The thumb and the filled track take the accent
 * seed. A continuous slider (no `step`) moves by a thousandth of the range.
 */
export function Slider({
  label,
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 1,
  step,
  disabled,
  accentColor,
  testID,
  style,
}: SliderProps) {
  const xaml = useXamlProps();
  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <XamlSlider
        value={value}
        min={min}
        max={max}
        step={step ?? 0}
        disabled={disabled}
        color={accentColor}
        label={label}
        onValueChange={event => onValueChange(event.nativeEvent.value)}
        onSlidingComplete={onSlidingComplete ? event => onSlidingComplete(event.nativeEvent.value) : undefined}
        style={styles.slider}
        {...xaml}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  label: {
    flexShrink: 1,
  },
  slider: {
    flex: 1,
  },
  disabled: {
    opacity: 0.4,
  },
});

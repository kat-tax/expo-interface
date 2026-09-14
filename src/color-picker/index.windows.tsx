import type {ColorPickerProps} from './types';
import {Pressable, StyleSheet, View} from 'react-native';
import XamlColorPicker from '../windows/specs/ExpoInterfaceColorPickerNativeComponent';
import {useXamlProps} from '../windows';
import {Label} from '../typography';
import {useColor} from '../theme';
import {parseColor, toCss, toHex, useColorValue} from './shared';

/** Diameter of a preset swatch, and of the ring drawn around the selected one. */
const SWATCH = 28;
const RING = 2;

/**
 * Windows renders a color well — a button showing the color — that opens a
 * WinUI 3 `Flyout` holding the platform's `ColorPicker` (spectrum, sliders,
 * hex field and, with `supportsOpacity`, the alpha channel) in a XAML
 * island, at the trailing edge of a row whose label the kit draws. Preset
 * `swatches` are drawn as round buttons before the well.
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  swatches,
  disabled,
  testID,
  style,
}: ColorPickerProps) {
  const xaml = useXamlProps();
  const ring = useColor('label');
  const [current, setCurrent] = useColorValue(value, onValueChange, supportsOpacity);
  const currentHex = toHex({...current, a: 1}, false);
  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <View style={styles.controls}>
        {swatches?.map(seed => {
          const selected = toHex(parseColor(seed), false) === currentHex;
          return (
            <Pressable
              key={seed}
              role="button"
              aria-label={`Color ${seed}`}
              aria-pressed={selected}
              disabled={disabled}
              onPress={() => setCurrent({...parseColor(seed), a: current.a})}
              style={[styles.swatch, {backgroundColor: seed}, selected && {borderColor: ring}]}
            />
          );
        })}
        <XamlColorPicker
          value={toHex(current, true)}
          alpha={supportsOpacity}
          disabled={disabled}
          label={label ?? 'Color'}
          onValueChange={event => setCurrent(parseColor(event.nativeEvent.value))}
          {...xaml}
        />
      </View>
    </View>
  );
}

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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
    flexShrink: 1,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    borderWidth: RING,
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
});

export {toCss};

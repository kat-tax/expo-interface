import type {MenuRect} from '../popup-menu/types';
import type {ColorPickerProps} from './types';
import {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import XamlColorPicker from '../windows/specs/ExpoInterfaceColorPickerNativeComponent';
import {useXamlProps} from '../windows';
import {PopupMenu} from '../popup-menu';
import {Label} from '../typography';
import {useColor} from '../theme';
import {NO_COLOR, sameColor, swatchMenu, swatchesOf} from './choices';
import {parseColor, toCss, toHex, useColorValue} from './shared';

/** Diameter of a preset swatch, and of the ring drawn around the selected one. */
const SWATCH = 28;
const RING = 2;
/** Diameter of the well a swatch menu opens from, and of the color inside its ring. */
const WELL = 28;
const WELL_INNER = 22;

/**
 * Windows renders a color well — a button showing the color — that opens a
 * WinUI 3 `Flyout` holding the platform's `ColorPicker` (spectrum, sliders,
 * hex field and, with `supportsOpacity`, the alpha channel) in a XAML
 * island, at the trailing edge of a row whose label the kit draws. Preset
 * `swatches` are drawn as round buttons before the well. The flyout is a
 * popover already, so `popover` is the row as it is; `inline` puts the
 * `ColorPicker` itself in the island, under the label; `menu` opens a
 * `MenuFlyout` of the swatches from a drawn well.
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  swatches,
  presentation = 'automatic',
  allowsNone = false,
  disabled,
  testID,
  style,
}: ColorPickerProps) {
  const xaml = useXamlProps();
  const ring = useColor('label');
  const separator = useColor('separator');
  const backdrop = useColor('background');
  const stroke = useColor('destructive');
  const [current, setCurrent] = useColorValue(value, onValueChange, supportsOpacity);
  // Where the well is in the controls, and the menu open beside it.
  const [well, setWell] = useState<MenuRect | null>(null);
  const [menuAt, setMenuAt] = useState<MenuRect | null>(null);
  const none = value === NO_COLOR;
  const presets = swatchesOf(swatches);
  const menu = presentation === 'menu';
  const inPlace = presentation === 'inline';

  /** A crossed-out circle: no color. */
  const crossed = (size: number) => (
    <View style={[styles.crossed, {width: size, height: size, borderRadius: size / 2, backgroundColor: backdrop}]}>
      <View style={[styles.stroke, {height: size, backgroundColor: stroke}]}/>
    </View>
  );

  return (
    <View style={[styles.row, inPlace && styles.column, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <View style={styles.controls}>
        {!menu && allowsNone ? (
          <Pressable
            role="button"
            aria-label="No color"
            aria-pressed={none}
            disabled={disabled}
            onPress={() => onValueChange(NO_COLOR)}
            style={[styles.swatch, styles.centered, none && {borderColor: ring}]}>
            {crossed(SWATCH - 2 * RING - 2)}
          </Pressable>
        ) : null}
        {menu ? null : presets.map(({color, name}) => {
          // The ring follows the color held here, which a pick changes at once.
      const selected = !none && sameColor(color, toHex(current, false));
          return (
            <Pressable
              key={color}
              role="button"
              aria-label={`Color ${name}`}
              aria-pressed={selected}
              disabled={disabled}
              onPress={() => setCurrent({...parseColor(color), a: current.a})}
              style={[styles.swatch, {backgroundColor: color}, selected && {borderColor: ring}]}
            />
          );
        })}
        {menu ? (
          <>
            <View onLayout={event => setWell(event.nativeEvent.layout)}>
              <Pressable
                role="button"
                aria-label={label ?? 'Color'}
                aria-haspopup="menu"
                disabled={disabled}
                onPress={() => setMenuAt(well)}
                style={[styles.well, styles.centered, {borderColor: separator}]}
                testID={testID ? `${testID}-well` : undefined}>
                {none ? crossed(WELL_INNER) : <View style={[styles.fill, {backgroundColor: toCss(current)}]}/>}
              </Pressable>
            </View>
            <PopupMenu
              items={swatchMenu(presets, value, allowsNone, supportsOpacity, onValueChange)}
              at={menuAt}
              onDismiss={() => setMenuAt(null)}
              testID={testID ? `${testID}-menu` : undefined}
            />
          </>
        ) : (
          <XamlColorPicker
            value={toHex(current, true)}
            alpha={supportsOpacity}
            disabled={disabled}
            label={label ?? 'Color'}
            inPlace={inPlace}
            onValueChange={event => setCurrent(parseColor(event.nativeEvent.value))}
            {...xaml}
          />
        )}
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
  // The picker in place: the label over it.
  column: {
    flexDirection: 'column',
    alignItems: 'flex-start',
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossed: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stroke: {
    width: 2,
    transform: [{rotate: '45deg'}],
  },
  well: {
    width: WELL,
    height: WELL,
    borderRadius: WELL / 2,
    borderWidth: 1,
  },
  fill: {
    width: WELL_INNER,
    height: WELL_INNER,
    borderRadius: WELL_INNER / 2,
  },
  disabled: {
    opacity: 0.4,
  },
});

export {toCss};

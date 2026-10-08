import type {MenuItem} from '../menu/types';
import type {ColorPickerProps, ColorPickerSwatch} from './types';
import {Platform} from 'react-native';
import {parseColor, toHex} from './shared';

/**
 * The platforms' own palettes, as `swatches="system"` gives them: Apple's
 * system colors on iOS and web, Material's on Android, and the Windows
 * accent palette on Windows.
 */
export const SYSTEM_SWATCHES: Record<'apple' | 'material' | 'fluent', readonly ColorPickerSwatch[]> = {
  apple: [
    {color: '#FF3B30', name: 'Red'},
    {color: '#FF9500', name: 'Orange'},
    {color: '#FFCC00', name: 'Yellow'},
    {color: '#34C759', name: 'Green'},
    {color: '#00C7BE', name: 'Mint'},
    {color: '#30B0C7', name: 'Teal'},
    {color: '#32ADE6', name: 'Cyan'},
    {color: '#007AFF', name: 'Blue'},
    {color: '#5856D6', name: 'Indigo'},
    {color: '#AF52DE', name: 'Purple'},
    {color: '#FF2D55', name: 'Pink'},
    {color: '#A2845E', name: 'Brown'},
  ],
  material: [
    {color: '#F44336', name: 'Red'},
    {color: '#E91E63', name: 'Pink'},
    {color: '#9C27B0', name: 'Purple'},
    {color: '#673AB7', name: 'Deep purple'},
    {color: '#3F51B5', name: 'Indigo'},
    {color: '#2196F3', name: 'Blue'},
    {color: '#00BCD4', name: 'Cyan'},
    {color: '#009688', name: 'Teal'},
    {color: '#4CAF50', name: 'Green'},
    {color: '#CDDC39', name: 'Lime'},
    {color: '#FFC107', name: 'Amber'},
    {color: '#FF9800', name: 'Orange'},
  ],
  fluent: [
    {color: '#E81123', name: 'Red'},
    {color: '#F7630C', name: 'Orange'},
    {color: '#FFB900', name: 'Gold'},
    {color: '#10893E', name: 'Green'},
    {color: '#00B294', name: 'Seafoam'},
    {color: '#0099BC', name: 'Teal'},
    {color: '#0078D7', name: 'Blue'},
    {color: '#6B69D6', name: 'Iris'},
    {color: '#8764B8', name: 'Violet'},
    {color: '#E3008C', name: 'Pink'},
    {color: '#7A7574', name: 'Gray'},
    {color: '#4C4A48', name: 'Charcoal'},
  ],
};

/**
 * The swatches a picker shows: its own, named as given or by their hex; the
 * platform's for `system`; none otherwise.
 */
export function swatchesOf(swatches: ColorPickerProps['swatches']): ColorPickerSwatch[] {
  if (swatches === 'system') {
    return [...(Platform.OS === 'android' ? SYSTEM_SWATCHES.material : Platform.OS === 'windows' ? SYSTEM_SWATCHES.fluent : SYSTEM_SWATCHES.apple)];
  }
  return (swatches ?? []).map(swatch => typeof swatch === 'string' ? {color: swatch, name: swatch} : swatch);
}

/** The value that says no color, as `allowsNone` reports it. */
export const NO_COLOR = '';

/** Whether two colors are the same, opacity aside. */
export function sameColor(a: string, b: string): boolean {
  return a !== NO_COLOR && b !== NO_COLOR && toHex({...parseColor(a), a: 1}, false) === toHex({...parseColor(b), a: 1}, false);
}

/**
 * A swatch menu's entries: "No color" first when allowed, then each swatch
 * with its dot, the one the value is checked. A swatch is picked opaque.
 */
export function swatchMenu(swatches: readonly ColorPickerSwatch[], value: string, allowsNone: boolean, supportsOpacity: boolean, pick: (value: string) => void): MenuItem[] {
  const items: MenuItem[] = swatches.map(({color, name}, index) => ({
    label: name,
    swatch: color,
    active: sameColor(color, value),
    separator: allowsNone && index === 0,
    onPress: () => pick(toHex({...parseColor(color), a: 1}, supportsOpacity)),
  }));
  if (allowsNone) items.unshift({label: 'No color', active: value === NO_COLOR, onPress: () => pick(NO_COLOR)});
  return items;
}

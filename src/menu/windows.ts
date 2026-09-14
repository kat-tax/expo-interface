import type {MenuItem} from './types';
import {glyphOf, jsonProp} from '../windows';

/**
 * The entries of a menu as the `items` JSON the `ExpoInterfaceMenuFlyout`
 * island builds its `MenuFlyout` from: the label, the Segoe glyph of the
 * icon, the swatch, and the flags. Handlers stay here and are found by
 * index when the island reports a pick.
 */
export function menuItemsProp(items: readonly MenuItem[]): string {
  return jsonProp(items.map(item => ({
    label: item.label,
    glyph: glyphOf(item.icon) ?? null,
    swatch: item.swatch ?? null,
    active: item.active === true,
    destructive: item.role === 'destructive',
    disabled: item.disabled === true,
    separator: item.separator === true,
  })));
}

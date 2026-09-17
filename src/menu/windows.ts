import type {MenuItem} from './types';
import {useEffect} from 'react';
import {glyphOf, jsonProp} from '../windows';
import {bindShortcut} from '../windows/shortcuts';

/**
 * The entries of a menu as the `items` JSON the `ExpoInterfaceMenuFlyout`
 * island builds its `MenuFlyout` from: the label, the Segoe glyph of the
 * icon, the swatch, the shortcut text, and the flags. Handlers stay here
 * and are found by index when the island reports a pick.
 */
export function menuItemsProp(items: readonly MenuItem[]): string {
  return jsonProp(items.map(item => ({
    label: item.label,
    glyph: glyphOf(item.icon) ?? null,
    swatch: item.swatch ?? null,
    shortcut: item.shortcut ?? null,
    active: item.active === true,
    destructive: item.role === 'destructive',
    disabled: item.disabled === true,
    separator: item.separator === true,
  })));
}

/**
 * Binds the shortcuts of a menu's items for as long as the menu is
 * mounted, as WinUI's keyboard accelerators are: the item's `onPress` runs
 * from the keys wherever the focus is, a disabled item's does not.
 */
export function useMenuShortcuts(items: readonly MenuItem[]): void {
  useEffect(() => {
    const unbind = items.flatMap(item => (item.shortcut && !item.disabled ? [bindShortcut(item.shortcut, () => item.onPress?.())] : []));
    return () => {
      for (const release of unbind) release();
    };
  }, [items]);
}

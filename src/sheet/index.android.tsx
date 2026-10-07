import type {SheetProps} from './types';

import {HostPaletteContext, useMaterialColors} from '@expo/ui/jetpack-compose';
import {BottomSheet} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';
import {sheetChildren, sheetOwnProps} from './compose';

/**
 * Android: the sheet's internal `Host` is not seeded (no `seedColor` prop is
 * forwarded by `BottomSheet`), so overlay `HostPaletteContext` with the
 * accent-seeded Material 3 palette. Every `useMaterialColors()` consumer in
 * the sheet (text fields, pickers, switches, list rows) then resolves the
 * same palette as the seeded `Screen` Host. Controls that also take explicit
 * accent colors (switch track, dialog tint, cursor) read `useColor('tint')`.
 * The bar, the accessory and the actions are Compose content beside the
 * React Native body, all direct children of the sheet.
 */
export function Sheet(props: SheetProps) {
  const {rest} = sheetOwnProps(props);
  const seed = useAccentSeed();
  const palette = useMaterialColors({seedColor: seed});
  return (
    <BottomSheet {...rest}>
      <NativeHostContext.Provider value={true}>
        <HostPaletteContext.Provider value={palette}>
          {sheetChildren(props)}
        </HostPaletteContext.Provider>
      </NativeHostContext.Provider>
    </BottomSheet>
  );
}

export type {SheetAction, SheetMaterial, SheetProps} from './types';

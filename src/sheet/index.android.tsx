import type {BottomSheetProps} from '@expo/ui';

import {HostPaletteContext, useMaterialColors} from '@expo/ui/jetpack-compose';
import {BottomSheet} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';

/**
 * Android: the sheet's internal `Host` is not seeded (no `seedColor` prop is
 * forwarded by `BottomSheet`), so overlay `HostPaletteContext` with the
 * accent-seeded Material 3 palette. Every `useMaterialColors()` consumer in
 * the sheet (text fields, pickers, switches, list rows) then resolves the
 * same palette as the seeded `Screen` Host. Controls that also take explicit
 * accent colors (switch track, dialog tint, cursor) read `useColor('tint')`.
 */
export function Sheet({children, ...props}: BottomSheetProps) {
  const seed = useAccentSeed();
  const palette = useMaterialColors({seedColor: seed});
  return (
    <BottomSheet {...props}>
      <NativeHostContext.Provider value={true}>
        <HostPaletteContext.Provider value={palette}>
          {children}
        </HostPaletteContext.Provider>
      </NativeHostContext.Provider>
    </BottomSheet>
  );
}

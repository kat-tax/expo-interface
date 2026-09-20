import type {SheetProps} from './types';

import {presentationBackground, tint} from '@expo/ui/swift-ui/modifiers';
import {BottomSheet} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';
import {IOS_MATERIAL, hasMaterial} from './shared';

/**
 * iOS: the accent seed as a `tint` presentation modifier on the sheet's
 * content, mirroring the Host-level cascade in `Screen` (`hostAccentProps`).
 * Without it, SwiftUI children in the sheet (toggles, pickers, text fields)
 * would render the default systemBlue instead of the user-supplied accent.
 */
export function Sheet({children, modifiers, material, ...props}: SheetProps) {
  const seed = useAccentSeed();
  // The real thing: SwiftUI's own blur and vibrancy, in both schemes, rather
  // than a translucent fill pretending to be one.
  const backdrop = hasMaterial(material)
    ? [presentationBackground({type: 'material', material: IOS_MATERIAL[material]})]
    : [];
  return (
    <NativeHostContext.Provider value={true}>
      <BottomSheet {...props} modifiers={[tint(seed), ...backdrop, ...(modifiers ?? [])]}>
        {children}
      </BottomSheet>
    </NativeHostContext.Provider>
  );
}

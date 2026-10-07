import type {SheetProps} from './types';

import {presentationBackground, tint} from '@expo/ui/swift-ui/modifiers';
import {BottomSheet} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';
import {sheetChildren, sheetOwnProps} from './compose';
import {IOS_MATERIAL, hasMaterial} from './shared';

/**
 * iOS: the accent seed as a `tint` presentation modifier on the sheet's
 * content, mirroring the Host-level cascade in `Screen` (`hostAccentProps`).
 * Without it, SwiftUI children in the sheet (toggles, pickers, text fields)
 * would render the default systemBlue instead of the user-supplied accent.
 * The bar, the accessory and the actions are SwiftUI content beside the
 * React Native body, all direct children of the sheet.
 */
export function Sheet(props: SheetProps) {
  const {own, rest} = sheetOwnProps(props);
  const {modifiers, ...sheet} = rest;
  const seed = useAccentSeed();
  // The real thing: SwiftUI's own blur and vibrancy, in both schemes, rather
  // than a translucent fill pretending to be one.
  const backdrop = hasMaterial(own.material)
    ? [presentationBackground({type: 'material', material: IOS_MATERIAL[own.material]})]
    : [];
  return (
    <NativeHostContext.Provider value={true}>
      <BottomSheet {...sheet} modifiers={[tint(seed), ...backdrop, ...(modifiers ?? [])]}>
        {sheetChildren(props)}
      </BottomSheet>
    </NativeHostContext.Provider>
  );
}

export type {SheetAction, SheetMaterial, SheetProps} from './types';

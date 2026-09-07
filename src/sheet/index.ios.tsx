import type {BottomSheetProps} from '@expo/ui';

import {tint} from '@expo/ui/swift-ui/modifiers';
import {BottomSheet} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';

/**
 * iOS: apply the accent seed as a `tint` presentation modifier on the sheet's
 * content, mirroring the Host-level cascade in `Screen` (`hostAccentProps`).
 * Without it, SwiftUI children in the sheet (toggles, pickers, text fields)
 * would render the default systemBlue instead of the user-supplied accent.
 */
export function Sheet({children, modifiers, ...props}: BottomSheetProps) {
  const seed = useAccentSeed();
  return (
    <NativeHostContext.Provider value={true}>
      <BottomSheet {...props} modifiers={[tint(seed), ...(modifiers ?? [])]}>
        {children}
      </BottomSheet>
    </NativeHostContext.Provider>
  );
}

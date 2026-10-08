import type {SheetProps} from './types';

import {VStack} from '@expo/ui/swift-ui';
import {frame, onGeometryChange, presentationBackground, tint} from '@expo/ui/swift-ui/modifiers';
import {BottomSheet} from '@expo/ui';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';
import {sheetChildren, sheetOwnProps} from './compose';
import {IOS_MATERIAL, hasMaterial} from './shared';
import {SheetContentWidthContext, useSheetContentWidth} from './width';

/**
 * iOS: the accent seed as a `tint` presentation modifier on the sheet's
 * content, mirroring the Host-level cascade in `Screen` (`hostAccentProps`).
 * Without it, SwiftUI children in the sheet (toggles, pickers, text fields)
 * would render the default systemBlue instead of the user-supplied accent.
 * The bar, the accessory, the actions and a body without `maxHeight` are
 * SwiftUI content; a capped body and the footer are React Native content,
 * each in an `RNHostView` the sheet's width.
 *
 * The pieces sit in one `VStack` with no spacing, the one member of the
 * `Group` the platform's sheet wraps its content in. SwiftUI applies a
 * group's modifiers to each member, and the fitted detent reads one size
 * per member and keeps the last: with the pieces as members, each would pay
 * the sheet's top padding and the sheet would fit only its last piece. The
 * stack is leading-aligned, so a piece narrower than the sheet sits where
 * it would on its own.
 *
 * The stack takes the width the sheet offers, whatever its pieces are, and
 * reports it: that is the width the hosted pieces are told, so they span a
 * sheet that fills a phone in landscape, stay inside its safe areas and
 * inside an inset sheet, and follow a rotation.
 */
export function Sheet(props: SheetProps) {
  const {own, rest} = sheetOwnProps(props);
  const {modifiers, ...sheet} = rest;
  const seed = useAccentSeed();
  const [width, onSize] = useSheetContentWidth();
  // The real thing: SwiftUI's own blur and vibrancy, in both schemes, rather
  // than a translucent fill pretending to be one.
  const backdrop = hasMaterial(own.material)
    ? [presentationBackground({type: 'material', material: IOS_MATERIAL[own.material]})]
    : [];
  return (
    <NativeHostContext.Provider value={true}>
      <BottomSheet {...sheet} modifiers={[tint(seed), ...backdrop, ...(modifiers ?? [])]}>
        <VStack
          spacing={0}
          alignment="leading"
          // With both bounds the frame is the width offered, never its content's,
          // so a hosted piece told a wider width cannot hold the measurement there.
          modifiers={[frame({minWidth: 0, maxWidth: Infinity, alignment: 'leading'}), onGeometryChange(onSize)]}>
          <SheetContentWidthContext.Provider value={width}>{sheetChildren(props)}</SheetContentWidthContext.Provider>
        </VStack>
      </BottomSheet>
    </NativeHostContext.Provider>
  );
}

export type {SheetAction, SheetMaterial, SheetMaxHeight, SheetProps} from './types';

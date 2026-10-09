import type {SheetProps} from './types';

import {useEffect, useRef, useState} from 'react';
import {Column, Host, ModalBottomSheet, type ModalBottomSheetRef} from '@expo/ui/jetpack-compose';
import {fillMaxHeight, fillMaxWidth, onSizeChanged, padding, testID as testIDModifier, type ModifierConfig} from '@expo/ui/jetpack-compose/modifiers';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';
import {hostAccentProps} from '../screen/host-accent';
import {sheetChildren, sheetOwnProps} from './compose';
import {SIDE_INSET, contentPaddingEdges, fillsMaxHeight, skipsPartiallyExpanded} from './shared';
import {SheetContentWidthContext, useSheetContentWidth} from './width';

/**
 * Android: Material's `ModalBottomSheet`, presented by the kit in a host of
 * its own. The kit presents the sheet itself rather than through
 * `@expo/ui`'s `BottomSheet` because Material opens a sheet taller than
 * half the window at a partially expanded stop, half way up, unless told to
 * skip that state, and `@expo/ui`'s wrapper says so only from `snapPoints`:
 * a sheet without them fits its content and has to open whole, its footer
 * and its actions on screen. The host is seeded with the accent as
 * `NativeHost` seeds its own, so the Compose content in the sheet is themed
 * from the accent and every `useMaterialColors()` consumer in it (text
 * fields, pickers, switches, list rows) resolves the palette a seeded
 * `Screen` host gives. Controls that also take explicit accent colors
 * (switch track, dialog tint, cursor) read `useColor('tint')`.
 *
 * The sheet is mounted while presented and unmounted once its hide
 * animation has run. Its content keeps Material's inset: 16 a side, and 16
 * at the top only without the drag handle, which keeps the content clear of
 * the top edge itself. The bar, the accessory, the actions and a body
 * without `maxHeight` are Compose content in the sheet's column; a capped
 * body and the footer are React Native content, each in an `RNHostView`
 * the sheet's width.
 *
 * The pieces sit in a column that fills the width the sheet offers and
 * reports it: that is the width the hosted pieces are told, so they follow
 * the sheet's own limit, its insets and a rotation.
 */
export function Sheet(props: SheetProps) {
  const {rest} = sheetOwnProps(props);
  const {
    isPresented,
    onDismiss,
    snapPoints,
    showDragIndicator = true,
    contentPadding,
    testID,
    modifiers,
    shouldDismissOnBackPress = true,
    shouldDismissOnClickOutside = true,
    scrimColor,
    containerColor,
    contentColor,
  } = rest;
  const seed = useAccentSeed();
  const [width, onSize] = useSheetContentWidth();
  const sheet = useRef<ModalBottomSheetRef>(null);
  const [mounted, setMounted] = useState(isPresented);
  if (isPresented && !mounted) setMounted(true);
  useEffect(() => {
    if (isPresented) return;
    // Hidden with its animation first and unmounted once that has run,
    // unless it was presented again in the meantime.
    let cancelled = false;
    sheet.current?.hide().then(() => {
      if (!cancelled) setMounted(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isPresented]);
  if (!mounted) return null;
  const {top, bottom, left, right} = contentPaddingEdges(contentPadding, {
    top: showDragIndicator ? 0 : SIDE_INSET,
    bottom: 0,
    left: SIDE_INSET,
    right: SIDE_INSET,
  });
  const content: ModifierConfig[] = [padding(left, top, right, bottom)];
  if (fillsMaxHeight(snapPoints)) content.push(fillMaxHeight());
  if (testID) content.push(testIDModifier(testID));
  return (
    <Host style={{position: 'absolute'}} pointerEvents="none" {...hostAccentProps(seed)}>
      <ModalBottomSheet
        ref={sheet}
        onDismissRequest={onDismiss}
        skipPartiallyExpanded={skipsPartiallyExpanded(snapPoints)}
        showDragHandle={showDragIndicator}
        properties={{shouldDismissOnBackPress, shouldDismissOnClickOutside}}
        scrimColor={scrimColor}
        containerColor={containerColor}
        contentColor={contentColor}
        modifiers={modifiers}>
        <Column modifiers={content}>
          <NativeHostContext.Provider value={true}>
            <Column modifiers={[fillMaxWidth(), onSizeChanged(onSize)]}>
              <SheetContentWidthContext.Provider value={width}>{sheetChildren(props)}</SheetContentWidthContext.Provider>
            </Column>
          </NativeHostContext.Provider>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}

export type {SheetAction, SheetMaterial, SheetMaxHeight, SheetProps} from './types';

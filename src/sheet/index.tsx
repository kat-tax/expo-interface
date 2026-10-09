import type {SheetProps} from './types';
import {BottomSheet} from '@expo/ui';
import {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import {NativeHostContext} from '../host';
import {materialAttributes} from '../material';
import {useOverlayMaterial} from '../material/context';
import {sheetChildren, sheetOwnProps} from './compose';
import {MATERIAL_OPACITY, hasMaterial} from './shared';

/** The heading in the bar's title box, which the drawn bar marks on web. */
const TITLE = '[data-ui-sheet-title] [role="heading"]';

/** The first control in the sheet a keyboard can reach, for a sheet without a title. */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accent-aware bottom sheet. `@expo/ui`'s `BottomSheet` mounts its own `Host`
 * without the accent seed (unlike `Screen`, which applies `hostAccentProps`),
 * so sheet content would fall back to the platform default tint. Resolved per
 * platform by Metro:
 * - `.ios.tsx`: prepends a `tint(seed)` presentation modifier so the accent
 *   cascades to all SwiftUI children in the sheet.
 * - `.android.tsx`: presents Material's sheet in a host of the kit's own,
 *   seeded with the accent as `NativeHost` seeds its hosts.
 * - Web (this file): accent flows through CSS custom properties; vaul sheet
 *   width is constrained via `global.css`. The material is the bar's, drawn
 *   on the drawer by `material.css`.
 * The bar, the accessory, the body, the footer and the actions are drawn by
 * the kit inside the drawer.
 *
 * The drawer leaves the keyboard focus where it was, on the control that
 * opened the sheet, while its dialog hides the rest of the page from
 * assistive technology, so a screen reader would sit on a hidden button.
 * The focus moves into the sheet as it opens instead, to the bar's title, a
 * heading it can land on, or else to the first control in the content, and
 * goes back to the control that opened the sheet once the content has left
 * the page.
 */
export function Sheet(props: SheetProps) {
  const {own, rest} = sheetOwnProps(props);
  const {containerColor, ...sheet} = rest;
  const material = useOverlayMaterial(own.material);
  const blurred = hasMaterial(material);
  // The content's element, in state rather than a ref: it arrives after the
  // sheet itself (the drawer's portal mounts a commit later), and the
  // drawer's focus scope notes where the focus came from in an effect of its
  // own once its element has arrived, which the move below has to follow. A
  // state change runs the effect again once the content is in the page,
  // after the scope's, and a render while the sheet stays open does not move
  // the focus again.
  const [content, setContent] = useState<View | null>(null);
  // What had the focus as the sheet opened, which gets it back.
  const opener = useRef<Element | null>(null);
  // The material is the bar's, drawn by `material.css` from the attributes
  // the bar carries. `@expo/ui`'s web sheet renders vaul in a portal outside
  // this tree and forwards only the props it names, so there is no element
  // of ours to put them on: they go onto the drawer itself once the content
  // is in the page, and come off with the material. The fill is the one
  // thing the stylesheet cannot draw there, since the drawer paints its own
  // inline, so it is handed in as `containerColor`, thinned the same way.
  useEffect(() => {
    if (!blurred || content === null) return;
    const drawer = (content as unknown as HTMLElement).closest('[data-vaul-drawer]')!;
    const attributes = Object.entries(materialAttributes(material, 'element', 'top')) as [string, string][];
    for (const [name, value] of attributes) drawer.setAttribute(name, value);
    return () => {
      for (const [name] of attributes) drawer.removeAttribute(name);
    };
  }, [blurred, material, content]);
  useEffect(() => {
    if (!sheet.isPresented || content === null) return;
    const root = content as unknown as HTMLElement;
    const target = root.querySelector<HTMLElement>(TITLE) ?? root.querySelector<HTMLElement>(FOCUSABLE);
    if (target === null) return;
    opener.current = document.activeElement;
    target.focus({preventScroll: true});
  }, [sheet.isPresented, content]);
  useEffect(() => {
    if (content === null) return;
    return () => {
      // The content has left the page, and the focus with it. The drawer
      // gives nothing back by itself: Radix's dialog returns the focus to a
      // trigger of its own, which a sheet opened from a prop has none of.
      const previous = opener.current as HTMLElement | null;
      opener.current = null;
      if (previous?.isConnected) previous.focus({preventScroll: true});
    };
  }, [content]);
  return (
    <NativeHostContext.Provider value={true}>
      {/* A material is a blur and a fill over it, so the drawer's own colour
          has to let some of the blur through: the bar's raised fill, thinned
          by the material's opacity. */}
      <BottomSheet
        {...sheet}
        containerColor={containerColor ?? (blurred ? translucent(MATERIAL_OPACITY[material]) : undefined)}>
        <View ref={setContent}>{sheetChildren(props)}</View>
      </BottomSheet>
    </NativeHostContext.Provider>
  );
}

/** The raised fill, thinned so the blur behind it shows through, as `material.css` thins it. */
function translucent(opacity: number): string {
  return `color-mix(in srgb, var(--color-background-element) ${Math.round(opacity * 100)}%, transparent)`;
}

export type {SheetAction, SheetMaterial, SheetMaxHeight, SheetProps} from './types';

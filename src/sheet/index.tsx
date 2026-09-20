import type {SheetProps} from './types';
import {BottomSheet} from '@expo/ui';
import {NativeHostContext} from '../host';
import {useEffect} from 'react';
import {BLUR_RADIUS, MATERIAL_OPACITY, hasMaterial} from './shared';

/**
 * Accent-aware bottom sheet. `@expo/ui`'s `BottomSheet` mounts its own `Host`
 * without the accent seed (unlike `Screen`, which applies `hostAccentProps`),
 * so sheet content would fall back to the platform default tint. Resolved per
 * platform by Metro:
 * - `.ios.tsx`: prepends a `tint(seed)` presentation modifier so the accent
 *   cascades to all SwiftUI children in the sheet.
 * - `.android.tsx`: overlays `HostPaletteContext` with the seeded Material 3
 *   palette so `useMaterialColors()` consumers match the seeded `Screen` Host.
 * - Web (this file): accent flows through CSS custom properties; vaul sheet
 *   width is constrained via `global.css`.
 */
export function Sheet({children, material, containerColor, ...props}: SheetProps) {
  const blurred = hasMaterial(material);
  // The blur reaches the sheet through a custom property on the root, because
  // `@expo/ui`'s web sheet renders vaul in a portal outside this tree and
  // forwards only the props it names — so there is no element of ours to put
  // `backdrop-filter` on. `global.css` reads the property; with no sheet open
  // it is absent and the rule is a no-op. One sheet at a time, which is what a
  // bottom sheet is.
  useEffect(() => {
    if (!blurred) return;
    const root = document.documentElement;
    root.style.setProperty('--ui-sheet-blur', `${BLUR_RADIUS[material]}px`);
    return () => {
      root.style.removeProperty('--ui-sheet-blur');
    };
  }, [blurred, material]);
  return (
    <NativeHostContext.Provider value={true}>
      {/* A material is a blur and a fill over it, so the sheet's own colour
          has to let some of the blur through. */}
      <BottomSheet
        {...props}
        containerColor={containerColor ?? (blurred ? translucent(MATERIAL_OPACITY[material]) : undefined)}>
        {children}
      </BottomSheet>
    </NativeHostContext.Provider>
  );
}

/** The scheme's background, thinned so the blur behind it shows through. */
function translucent(opacity: number): string {
  return `color-mix(in srgb, var(--color-background) ${Math.round(opacity * 100)}%, transparent)`;
}

import type {BottomSheetProps} from '@expo/ui';
import {BottomSheet} from '@expo/ui';

/**
 * Accent-aware bottom sheet. `@expo/ui`'s `BottomSheet` mounts its own `Host`
 * without the accent seed (unlike `Screen`, which applies `hostAccentProps`),
 * so sheet content would fall back to the platform default tint. Resolved per
 * platform by Metro:
 * - `.ios.tsx`: prepends a `tint(seed)` presentation modifier so the accent
 *   cascades to all SwiftUI children in the sheet.
 * - `.android.tsx`: overlays `HostPaletteContext` with the seeded Material 3
 *   palette so `useMaterialColors()` consumers match the seeded `Screen` Host.
 * - Web (this file): nothing; the accent flows through CSS custom properties.
 */
export function Sheet(props: BottomSheetProps) {
  return <BottomSheet {...props}/>;
}

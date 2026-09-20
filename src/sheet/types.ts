import type {BottomSheetProps} from '@expo/ui';

/**
 * How much of what is behind the sheet shows through it.
 *
 * Named for what it does rather than for any one platform's word: `thin` lets
 * a lot through, `thick` almost nothing. `none` is the opaque sheet, which is
 * what every platform drew before this prop existed and still the right answer
 * for a sheet holding a form.
 */
export type SheetMaterial = 'none' | 'thin' | 'regular' | 'thick';

/**
 * The kit's bottom sheet.
 *
 * `material` is honoured where the platform has one of its own:
 *
 * - **iOS** — `presentationBackground` with a SwiftUI material, which is the
 *   real thing: the system's blur, its vibrancy and its behaviour in both
 *   schemes.
 * - **Web** — `backdrop-filter`, which is the same idea and the platform's own
 *   way of saying it.
 * - **Android** — no material. Compose's `ModalBottomSheet` takes a
 *   `containerColor` and nothing else, so the sheet stays opaque.
 * - **Windows** — no material. The sheet is drawn in a React Native layer
 *   because its content is React Native's and no XAML flyout can hold that,
 *   so there is no XAML surface to put an acrylic brush on.
 *
 * Where it is not honoured the sheet is opaque, which is the same thing it was
 * before — a material that quietly does nothing is worse than one that is
 * documented as absent.
 */
export interface SheetProps extends BottomSheetProps {
  material?: SheetMaterial;
}

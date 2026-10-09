import type {ReactNode} from 'react';
import type {BottomSheetProps} from '@expo/ui';
import type {MaterialThickness} from '../material/types';
import type {MenuItem} from '../menu/types';

/** How much of what is behind the sheet shows through it: the kit's `MaterialThickness`. */
export type SheetMaterial = MaterialThickness;

/**
 * A height in points, or a fraction of the window's height: `{fraction: 0.6}`
 * is 60% of it, kept between 0 and 1. On web the fraction is of the
 * viewport's dynamic height (`dvh`), which follows a phone browser's
 * toolbar; on Windows it is of the area the sheet's layer covers, which is
 * the window under the kit's `Stack`. On an iPad the sheet is a form sheet,
 * shorter than the window, while the fraction is still of the window's
 * height, so a fraction there leaves less of the sheet for the rest than on
 * a phone.
 *
 * It caps the body alone: the bar, the accessory, the footer, the actions
 * and the sheet's padding come on top, so leave room for them with a
 * fraction well under 1. With a fraction near 1 the sheet is taller than
 * the platform lets it be: on iOS and Android the footer and the actions
 * are pushed out of it, and on web the drawer, which stops short of the
 * viewport's top, scrolls as a whole around the body's own scrolling. On
 * Windows the card stops short of the window and the body gives way inside
 * it.
 */
export type SheetMaxHeight = number | {fraction: number};

/** One of the buttons along a sheet's bottom edge: Cancel, Save, Delete. */
export interface SheetAction {
  label: string;
  onPress?: () => void;
  /**
   * `destructive` draws the button in the danger color.
   * @default 'default'
   */
  role?: 'default' | 'destructive';
  /**
   * The button's look; the last action is `filled` and the rest `outlined`
   * when left out.
   */
  variant?: 'filled' | 'outlined' | 'text';
  disabled?: boolean;
  /** Draws a spinner in place of the button's icon while something runs. */
  loading?: boolean;
}

/**
 * The kit's bottom sheet: `@expo/ui`'s `BottomSheet` with a material, a
 * title bar, a cap on its height, and the rows a sheet of a form or a
 * conversation ends in.
 *
 * `material` is honoured where the platform has one of its own:
 *
 * - **iOS**: `presentationBackground` with a SwiftUI material, which is the
 *   real thing: the system's blur, its vibrancy and its behaviour in both
 *   schemes.
 * - **Web**: `backdrop-filter`, which is the same idea and the platform's own
 *   way of saying it.
 * - **Android**: no material. Compose's `ModalBottomSheet` takes a
 *   `containerColor` and nothing else, so the sheet stays opaque.
 * - **Windows**: no material. The sheet is drawn in a React Native layer
 *   because its content is React Native's and no XAML flyout can hold that,
 *   so there is no XAML surface to put an acrylic brush on.
 *
 * Where it is not honoured the sheet is opaque: a material that quietly does
 * nothing is worse than one that is documented as absent.
 *
 * Without `snapPoints` the sheet fits its content on every platform:
 * SwiftUI's fitted detent, Compose's intrinsic height, the drawer's own on
 * web. On Android it opens whole: Material offers a sheet taller than half
 * the window a stop half way up, and the sheet skips it. `maxHeight` caps
 * the body, which scrolls inside the cap.
 *
 * The sheet's content is not under a screen's bar, so `useScrollInsets()`
 * answers zero inside it, whatever screen the sheet opens from.
 */
export interface SheetProps extends BottomSheetProps {
  /**
   * The body. On iOS and Android a body without `maxHeight` is the sheet's
   * native content, as the bar is, so it must be `@expo/ui` content (a
   * `FieldGroup`, a `List`, a `ColorPicker`), where the kit's controls render
   * bare, and it takes all the room the sheet offers: a `List`, or a
   * `FieldGroup` taller than the room, leaves the footer and the actions
   * none, so give those a `maxHeight` too. With `maxHeight` the body is
   * React Native content hosted in the sheet at the sheet's width: a
   * `Pressable` in it takes presses, a control in it mounts a host of its
   * own, a `List` in it is the cap tall and scrolls inside it, and `@expo/ui`
   * content of the app's own needs a `NativeHost` around it. Give a React
   * Native body a `maxHeight`. On web and Windows the body can be either.
   */
  children?: ReactNode;
  /**
   * The material the sheet draws on, where the platform has one (see
   * above). The app's `overlayMaterial` (`AccentProvider`) unless given.
   */
  material?: SheetMaterial;
  /**
   * The sheet's name, in a bar along its top: native text on iOS and
   * Android, the kit's on web and Windows. The bar holds the back button,
   * the menu and the close button too, and is drawn as soon as any of them
   * is given.
   */
  title?: string;
  /** A second line under the title, in the secondary color. */
  subtitle?: string;
  /** A back button at the bar's leading edge, for a sheet with pages in it. */
  onBack?: () => void;
  /**
   * A close button at the bar's trailing edge. The sheet does not dismiss
   * itself from it: the app does, as it does from `onDismiss`.
   */
  onClose?: () => void;
  /** The sheet's own actions, as the platform's menu behind an ellipsis in the bar, before the close button. */
  menu?: MenuItem[];
  /**
   * A row under the bar and above the body: a `SegmentedControl` that picks
   * what the body shows, a search field. Native content on iOS and Android,
   * as the bar is.
   */
  accessory?: ReactNode;
  /**
   * The row along the bottom edge, under the body: a `Composer`, a notice.
   * React Native content on every platform; on iOS and Android it is hosted
   * in the sheet at the sheet's width, so it takes presses and a control in
   * it mounts a host of its own. There `@expo/ui` content of the app's own
   * draws nothing without a host: wrap it in a `NativeHost`.
   */
  footer?: ReactNode;
  /**
   * Buttons along the bottom edge, after the footer, trailing-aligned: the
   * last one filled, the rest outlined.
   */
  actions?: SheetAction[];
  /**
   * The most the body alone grows to, in points or as a fraction of the
   * window's height ({@link SheetMaxHeight}). A sheet without `snapPoints`
   * fits its content; past this height the body scrolls inside the sheet
   * instead, as React Native content the width of the sheet. On iOS and
   * Android a body that takes all the room it is offered (a `List`, a long
   * `FieldGroup`) needs the cap to leave the footer and the actions theirs,
   * and a `List` as the body is then the cap tall.
   */
  maxHeight?: SheetMaxHeight;
}

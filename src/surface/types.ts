import type {PropsWithChildren} from 'react';
import type {LayoutChangeEvent, StyleProp, ViewStyle} from 'react-native';

/** Fill of a `Surface`, from the theme's background tokens. */
export type SurfaceColor = 'background' | 'element' | 'selected' | 'none';

/** Where a `Surface` draws its hairline. */
export type SurfaceBorder = 'none' | 'all' | 'top' | 'bottom';

/**
 * A box in the theme's own colors: the bar under a canvas, the strip of
 * tools floating over it, a card, a drop target, a notice.
 *
 * The one kit component that is React Native on every platform. Everything
 * else here draws with the platform's toolkit, but a surface exists to hold
 * things that are not native — a canvas, a preview, a `NativeHost` of
 * controls — and a native box cannot contain those. What it takes off a
 * screen is the palette: no `backgroundElement`, `separator` or shadow
 * literals in an app's styles.
 */
export interface SurfaceProps extends PropsWithChildren {
  /**
   * Fill.
   * @default 'element'
   */
  color?: SurfaceColor;
  /**
   * Where the hairline goes: all round (a card), one edge (a bar), or
   * nowhere.
   * @default 'none'
   */
  border?: SurfaceBorder;
  /** Draw the hairline dashed, for a drop target. */
  dashed?: boolean;
  /** Hairline color. Defaults to the theme `separator`. */
  borderColor?: string;
  /**
   * Corner radius in points; `pill` rounds the ends fully.
   * @default 12
   */
  radius?: number | 'pill';
  /** Lift the surface off the content behind it with a soft shadow. */
  raised?: boolean;
  /** Padding inside the surface, in points. */
  padding?: number;
  /** Makes the whole surface pressable (a card). */
  onPress?: () => void;
  /** Called on a long press. */
  onLongPress?: () => void;
  /** Dims the surface and ignores presses. */
  disabled?: boolean;
  /** Accessibility name, for a pressable surface. */
  label?: string;
  /** Called with the surface's size once it is laid out. */
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Style applied to the surface, after everything the props set. */
  style?: StyleProp<ViewStyle>;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
}

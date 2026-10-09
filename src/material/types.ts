import type {PropsWithChildren} from 'react';
import type {LayoutChangeEvent, StyleProp, ViewStyle} from 'react-native';

/**
 * How much of what is behind a material shows through it.
 *
 * Named for what it does rather than for any one platform's word: `thin`
 * lets a lot through, `thick` almost nothing. `none` is the opaque fill, the
 * default and the right answer for a sheet holding a form. It is what a
 * `Sheet`, the kit's bars and, on the web, every overlay take.
 */
export type MaterialThickness = 'none' | 'thin' | 'regular' | 'thick';

/** Which of the palette's fills a material thins over its blur: the raised fill, or the screen's. */
export type MaterialFill = 'element' | 'background';

/**
 * Where a material's hairline goes: all around a pill, along the top or the
 * bottom of a bar, or nowhere. `float` is a hairline all round and a
 * floating shadow, for an overlay: a menu, a card, a toast.
 */
export type MaterialEdge = 'all' | 'top' | 'bottom' | 'float' | 'none';

/**
 * The `data-*` attributes that draw a DOM element on one of the kit's
 * materials on the web (see `materialAttributes`); nothing for `none`.
 */
export interface MaterialAttributes {
  'data-material'?: Exclude<MaterialThickness, 'none'>;
  'data-material-fill'?: MaterialFill;
  'data-material-edge'?: MaterialEdge;
}

/**
 * How much of what passes under a material shows through it, thinnest
 * first. `glass` is iOS 26's Liquid Glass where the system has it, and
 * `regular` everywhere else.
 */
export type MaterialKind = 'thin' | 'regular' | 'thick' | 'glass';

/**
 * A view drawn on the platform's material, with its children on top (see
 * `Material`).
 */
export interface MaterialProps extends PropsWithChildren {
  /**
   * The thickness, or Liquid Glass.
   * @default 'regular'
   */
  kind?: MaterialKind;
  /**
   * Web and Android: the palette fill the material is made of, the
   * screen's background or the raised fill. iOS and Windows draw the
   * system's material, whose color is the system's.
   * @default 'background'
   */
  fill?: MaterialFill;
  /**
   * Where the hairline goes.
   * @default 'none'
   */
  edge?: MaterialEdge;
  /** Corner radius, in points. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  testID?: string;
}

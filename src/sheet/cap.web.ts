import type {DimensionValue} from 'react-native';
import type {SheetMaxHeight} from './types';
import {capFraction} from './shared';

/**
 * Web: the body's cap, points as they are and a fraction in the viewport's
 * dynamic height, which follows a phone browser's toolbar as it shows and
 * hides, and needs no render when the window resizes.
 */
export function useSheetBodyCap(maxHeight: SheetMaxHeight | undefined): DimensionValue | undefined {
  if (typeof maxHeight !== 'object') return maxHeight;
  return `${Math.round(capFraction(maxHeight.fraction) * 10000) / 100}dvh` as DimensionValue;
}

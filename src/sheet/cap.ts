import type {DimensionValue} from 'react-native';
import type {SheetMaxHeight} from './types';
import {useWindowDimensions} from 'react-native';
import {bodyCap} from './shared';

/** iOS and Android: the body's cap in points, a fraction taken of the window's height. */
export function useSheetBodyCap(maxHeight: SheetMaxHeight | undefined): DimensionValue | undefined {
  const {height} = useWindowDimensions();
  return bodyCap(maxHeight, height);
}

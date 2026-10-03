import type {ViewProps} from 'react-native';
import type {SheetMaterial} from '../sheet/types';
import type {MaterialEdge, MaterialFill} from './types';

/**
 * iOS and Android: a bar's material is the web's, drawn with CSS. The native
 * stack and tab bars draw their own, so a view here paints itself as usual.
 */
export function materialProps(_material: SheetMaterial | undefined, _fill: MaterialFill, _edge: MaterialEdge): ViewProps {
  return {};
}

export type {MaterialEdge, MaterialFill} from './types';

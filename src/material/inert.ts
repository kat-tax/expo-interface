import type {ViewProps} from 'react-native';
import type {MaterialAttributes, MaterialEdge, MaterialFill, MaterialThickness} from './types';

/**
 * iOS, Android and Windows: a bar's material is the web's, drawn with CSS.
 * The native stack and tab bars draw their own, so a view here paints
 * itself as usual.
 */
export function materialProps(_material: MaterialThickness | undefined, _fill: MaterialFill, _edge: MaterialEdge): ViewProps {
  return {};
}

/** iOS, Android and Windows: no DOM, so nothing to attribute. */
export function materialAttributes(_material: MaterialThickness | undefined, _fill: MaterialFill, _edge: MaterialEdge): MaterialAttributes {
  return {};
}

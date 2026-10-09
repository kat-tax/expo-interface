import type {ViewStyle} from 'react-native';
import type {MaterialEdge} from './types';
import {StyleSheet} from 'react-native';

/**
 * The hairline a natively drawn material puts at its edge, in the given
 * color; all round for `float` too, whose shadow is the web's, and nothing
 * for `none`.
 */
export function edgeStyle(edge: MaterialEdge, color: string): ViewStyle | null {
  const width = StyleSheet.hairlineWidth;
  switch (edge) {
    case 'all':
    case 'float': return {borderWidth: width, borderColor: color};
    case 'top': return {borderTopWidth: width, borderColor: color};
    case 'bottom': return {borderBottomWidth: width, borderColor: color};
    default: return null;
  }
}

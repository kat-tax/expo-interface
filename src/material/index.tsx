import './material.css';
import type {ViewProps} from 'react-native';
import type {SheetMaterial} from '../sheet/types';
import type {MaterialEdge, MaterialFill} from './types';
import {hasMaterial} from '../sheet/shared';

/**
 * The props that draw a React Native view as one of the kit's materials on
 * the web: its fill thinned over a blur of what passes under it, a hairline
 * at its edge and a soft shadow, by the rules in `material.css`. The view
 * must paint no background of its own while it carries one. Nothing for
 * `none`, where the view paints itself as usual.
 */
export function materialProps(material: SheetMaterial | undefined, fill: MaterialFill, edge: MaterialEdge): ViewProps {
  if (!hasMaterial(material)) return {};
  // react-native-web writes `dataSet` out as `data-*` attributes, which the
  // stylesheet selects; React Native's own types do not know the prop.
  return {dataSet: {material, materialFill: fill, materialEdge: edge}} as ViewProps;
}

export type {MaterialEdge, MaterialFill} from './types';

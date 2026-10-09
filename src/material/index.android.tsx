import type {MaterialProps} from './types';
import {View} from 'react-native';
import {useColor} from '../theme';
import {edgeStyle} from './edge';

export {materialAttributes, materialProps} from './inert';

/**
 * Android: the children on the palette fill, opaque. Material 3 has no
 * material that shows what passes under it; its surfaces are solid.
 */
export function Material({fill = 'background', edge = 'none', radius, style, onLayout, testID, children}: MaterialProps) {
  const color = useColor(fill === 'element' ? 'backgroundElement' : 'background');
  const separator = useColor('separator');
  return (
    <View style={[{backgroundColor: color, borderRadius: radius}, edgeStyle(edge, separator), style]} onLayout={onLayout} testID={testID}>
      {children}
    </View>
  );
}

export type {MaterialAttributes, MaterialEdge, MaterialFill, MaterialKind, MaterialProps, MaterialThickness} from './types';

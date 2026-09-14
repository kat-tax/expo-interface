import type {DividerProps} from './types';
import {StyleSheet, View} from 'react-native';
import {useColor} from '../theme';

/**
 * Windows draws the rule as a hairline view in the theme's `separator`,
 * the stroke WinUI's own dividers use.
 */
export function Divider({vertical, color, inset, testID}: DividerProps) {
  const separator = useColor('separator');
  return (
    <View
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      testID={testID}
      style={[
        vertical ? styles.vertical : styles.horizontal,
        {backgroundColor: color ?? separator},
        inset ? (vertical ? {marginTop: inset} : {marginLeft: inset}) : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
  },
  vertical: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
  },
});

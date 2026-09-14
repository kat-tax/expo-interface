import type {TooltipProps} from './types';
import {View} from 'react-native';

/**
 * Windows: react-native-windows draws the platform's tooltip itself for any
 * view with a `tooltip` — shown on hover and keyboard focus, placed by the
 * system — so the hint is that one prop on a view around the content.
 * (`tooltip` is a Windows-only view prop, which React Native's types do not
 * declare.)
 */
export function Tooltip({text, children, testID}: TooltipProps) {
  return (
    <View testID={testID} {...({tooltip: text} as object)}>
      {children}
    </View>
  );
}

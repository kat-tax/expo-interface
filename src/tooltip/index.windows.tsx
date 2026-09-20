import type {TooltipProps} from './types';
import {View} from 'react-native';

/**
 * Windows: react-native-windows draws the platform's tooltip itself for any
 * view with a `tooltip` — shown on hover and keyboard focus, placed by the
 * system — so the hint is that one prop on a view around the content.
 * (`tooltip` is a Windows-only view prop, which React Native's types do not
 * declare.)
 *
 * **It is a pointer and keyboard-focus affordance here and nothing more**,
 * which was tried and measured rather than assumed. `accessibilityHint` on
 * this wrapper would be where `UIA_HelpTextPropertyId` comes from, but the
 * wrapper is not what takes the focus — the control inside it is, and
 * react-native-windows composes nothing from an ancestor — so Narrator reads
 * the control and the hint goes unsaid. Putting it on the control is the only
 * thing that would work, and `Tooltip` does not own its children. An app that
 * needs the text announced should set `accessibilityHint` on the control
 * itself. (iOS differs because SwiftUI merges a `Group`'s children into one
 * accessibility element, so the hint there lands on the thing in focus.)
 */
export function Tooltip({text, children, testID}: TooltipProps) {
  return (
    <View testID={testID} {...({tooltip: text} as object)}>
      {children}
    </View>
  );
}

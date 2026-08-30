import type {TooltipProps} from './types';

import {Text, TooltipBox} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '../theme';

/**
 * Android renders the Material 3 `TooltipBox` with a `PlainTooltip`: a
 * long-press on `children` shows the hint, colored like the web hint
 * (inverse surface) from the theme tokens.
 */
export function Tooltip({text, children, testID}: TooltipProps) {
  const container = useColor('label');
  const content = useColor('background');
  return (
    <TooltipBox modifiers={testID ? [testIDModifier(testID)] : undefined}>
      <TooltipBox.PlainTooltip containerColor={container} contentColor={content}>
        <Text color={content}>{text}</Text>
      </TooltipBox.PlainTooltip>
      {children}
    </TooltipBox>
  );
}

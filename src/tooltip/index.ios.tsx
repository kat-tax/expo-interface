import type {TooltipProps} from './types';

import {Group} from '@expo/ui/swift-ui';
import {accessibilityHint} from '@expo/ui/swift-ui/modifiers';

/**
 * iOS has no tooltip idiom (SwiftUI's `help()` is macOS/visionOS only), so
 * the content renders unchanged inside a `Group` that exposes `text` to
 * VoiceOver as an accessibility hint.
 */
export function Tooltip({text, children, testID}: TooltipProps) {
  return (
    <Group modifiers={[accessibilityHint(text)]} testID={testID}>
      {children}
    </Group>
  );
}

import type {ColorPickerProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {ColorPicker as SwiftUIColorPicker} from '@expo/ui/swift-ui';
import {disabled as disabledMod} from '@expo/ui/swift-ui/modifiers';

/**
 * iOS renders SwiftUI's `ColorPicker`: the label with the rainbow-ringed
 * color well at the trailing edge, which opens the system color picker.
 * SwiftUI reports the selection as `#RRGGBBAA` when opacity is supported and
 * `#RRGGBB` otherwise; the other platforms mirror both formats.
 */
export function ColorPicker({
  label,
  value,
  onValueChange,
  supportsOpacity = true,
  disabled,
  testID,
}: ColorPickerProps) {
  const modifiers: ViewModifier[] = [];
  if (disabled) modifiers.push(disabledMod(true));
  return (
    <SwiftUIColorPicker
      label={label}
      selection={value}
      supportsOpacity={supportsOpacity}
      onSelectionChange={onValueChange}
      modifiers={modifiers}
      testID={testID}
    />
  );
}

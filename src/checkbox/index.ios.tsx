import type {CheckboxProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Button, HStack, Image, Spacer, Text} from '@expo/ui/swift-ui';
import {buttonStyle, disabled as disabledMod, foregroundStyle} from '@expo/ui/swift-ui/modifiers';
import {fillWidth} from '../fill';
import {useColor} from '../theme';

const ICON_SIZE = 22;

/**
 * SwiftUI on iOS has no checkbox control (the `.checkbox` toggle style is
 * macOS only), so the row is the platform idiom instead: a plain `Button`
 * holding the label and a tinted `checkmark.square.fill` / `square` glyph
 * pinned to the trailing edge. The glyph follows the accent seed like the
 * Host `tint` cascade; `accentColor` overrides it per instance.
 */
export function Checkbox({
  label,
  value,
  onValueChange,
  disabled,
  accentColor,
  testID,
}: CheckboxProps) {
  const tint = useColor('tint');
  const labelColor = useColor(disabled ? 'secondaryLabel' : 'label');
  const modifiers: ViewModifier[] = [buttonStyle('plain')];
  if (disabled) modifiers.push(disabledMod(true));

  const glyph = (
    <Image
      systemName={value ? 'checkmark.square.fill' : 'square'}
      color={value ? (accentColor ?? tint) : labelColor}
      size={ICON_SIZE}
    />
  );

  return (
    <Button onPress={() => onValueChange(!value)} modifiers={modifiers} testID={testID}>
      {label == null ? glyph : (
        <HStack spacing={8} modifiers={fillWidth}>
          <Text modifiers={[foregroundStyle(labelColor)]}>{label}</Text>
          <Spacer/>
          {glyph}
        </HStack>
      )}
    </Button>
  );
}

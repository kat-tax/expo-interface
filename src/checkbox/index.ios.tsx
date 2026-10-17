import type {CheckboxProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Button, HStack, Image, Spacer, Text} from '@expo/ui/swift-ui';
import {accessibilityAddTraits, accessibilityHidden, buttonStyle, contentShape, disabled as disabledMod, foregroundStyle, shapes} from '@expo/ui/swift-ui/modifiers';
import {fillWidth} from '../fill';
import {useColor} from '../theme';

const ICON_SIZE = 22;

/** The glyph says nothing to VoiceOver: the button's traits carry the state. */
const GLYPH = [accessibilityHidden(true)];

/**
 * The labelled row, the width it is given and all of it the button's: a
 * plain button takes a tap only on what it draws, and the `Spacer` between
 * the label and the glyph draws nothing.
 */
const ROW = [...fillWidth, contentShape(shapes.rectangle())];

/**
 * SwiftUI on iOS has no checkbox control (the `.checkbox` toggle style is
 * macOS only), so the row is the platform idiom instead: a plain `Button`
 * holding the label and a tinted `checkmark.square.fill` / `square` glyph
 * pinned to the trailing edge, taking a tap anywhere along the row. The
 * glyph follows the accent seed like the Host `tint` cascade; `accentColor`
 * overrides it per instance.
 *
 * VoiceOver hears a toggle that is on or off, as for a checkbox elsewhere:
 * the toggle trait always (iOS 17 and later read it, older systems ignore
 * it) and the selected trait while `value` is on. The glyph is hidden from
 * it, so the state comes from `value` alone and not from what SwiftUI makes
 * of the symbol inside the button.
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
  modifiers.push(accessibilityAddTraits(value ? ['isToggle', 'isSelected'] : ['isToggle']));

  const glyph = (
    <Image
      systemName={value ? 'checkmark.square.fill' : 'square'}
      color={value ? (accentColor ?? tint) : labelColor}
      size={ICON_SIZE}
      modifiers={GLYPH}
    />
  );

  return (
    <Button onPress={() => onValueChange(!value)} modifiers={modifiers} testID={testID}>
      {label == null ? glyph : (
        <HStack spacing={8} modifiers={ROW}>
          <Text modifiers={[foregroundStyle(labelColor)]}>{label}</Text>
          <Spacer/>
          {glyph}
        </HStack>
      )}
    </Button>
  );
}

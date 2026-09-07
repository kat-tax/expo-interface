import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';
import type {FabProps} from './types';

import {Button, HStack, Image, Menu as SwiftUIMenu, Text} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  background,
  buttonStyle,
  disabled as disabledMod,
  font,
  foregroundStyle,
  frame,
  opacity,
  padding,
  shadow,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol} from '../button/shared';
import {NativeHost} from '../host';
import {MenuItems} from '../menu/index.ios';
import {useColor} from '../theme';
import {FAB_EXTENDED_PADDING, FAB_GAP, FAB_ICON, FAB_RADIUS, FAB_SIZE} from './shared';

/**
 * iOS has no floating action button, so it is drawn in SwiftUI: a rounded
 * square (56 pt, 40 small, 96 large; a circle with `shape="circle"`) or, when
 * extended, a rounded bar as wide as its label. Filled with the tint, the
 * icon in `onTint`, a soft shadow, as the label of a plain `Button`; with
 * `items`, as the label of a SwiftUI `Menu`, whose entries are the ones the
 * kit's `Menu` renders. Rounded corners are continuous — Apple's squircle,
 * not a circular arc.
 */
export function Fab({label, icon, onPress, items, size = 'regular', shape = 'rounded', disabled, testID}: FabProps) {
  const tint = useColor('tint');
  const onTint = useColor('onTint');
  const circle = size !== 'extended';
  const dimension = FAB_SIZE[size];
  const faceModifiers: ViewModifier[] = [
    circle ? frame({width: dimension, height: dimension}) : frame({height: dimension}),
  ];
  if (!circle) faceModifiers.push(padding({horizontal: FAB_EXTENDED_PADDING}));
  faceModifiers.push(
    background(tint, shape === 'circle'
      ? (circle ? shapes.circle() : shapes.capsule())
      : shapes.roundedRectangle({cornerRadius: FAB_RADIUS[size], roundedCornerStyle: 'continuous'})),
    shadow({radius: 4, y: 2, color: 'rgba(0, 0, 0, 0.25)'}),
  );
  const face = (
    <HStack spacing={FAB_GAP} modifiers={faceModifiers}>
      <Image systemName={iosSymbol(icon)} color={onTint} size={FAB_ICON[size]}/>
      {circle ? null : (
        <Text modifiers={[foregroundStyle({type: 'color', color: onTint}), font({weight: 'semibold'})]}>{label}</Text>
      )}
    </HStack>
  );
  const modifiers: ViewModifier[] = [buttonStyle('plain'), accessibilityLabel(label)];
  if (disabled) modifiers.push(disabledMod(true), opacity(0.4));

  return (
    <NativeHost fit>
      {items ? (
        <SwiftUIMenu label={face} modifiers={modifiers} testID={testID}>
          <MenuItems items={items}/>
        </SwiftUIMenu>
      ) : (
        <Button onPress={onPress} modifiers={modifiers} testID={testID}>
          {face}
        </Button>
      )}
    </NativeHost>
  );
}

import type {MenuItem, MenuProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Fragment} from 'react';
import {Button, Divider, HStack, Image, Menu as SwiftUIMenu, Text, Toggle} from '@expo/ui/swift-ui';
import {accessibilityAddTraits, accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, disabled as disabledMod, labelStyle, tint} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol, swiftBorderShape, swiftControlSize} from '../button/shared';
import {onAccent as contrastOf} from '../accent';
import {SelfHosted} from '../host';
import {useColor} from '../theme';
import {swatchImage} from './swatch-file';

/** The dot's size in points, the one `swatch.ts` draws at 3x. */
const SWATCH_SIZE = 16;

const VARIANT_STYLE = {
  filled: 'borderedProminent',
  outlined: 'bordered',
  text: 'plain',
} as const;

/**
 * iOS renders SwiftUI's `Menu`, in a host of its own where there is none
 * above it, so a menu can be placed in a React Native layout like any
 * element.
 */
export function Menu(props: MenuProps) {
  return (
    <SelfHosted>
      <NativeMenu {...props}/>
    </SelfHosted>
  );
}

/**
 * The SwiftUI `Menu`, styled with the same `buttonStyle` / `tint` mapping as
 * the kit's `Button` so the trigger matches: one that is `pressed` is filled
 * whatever its variant and selected to VoiceOver, as the button is. Entries
 * are SwiftUI `Button`s (with SF Symbol and `destructive` role), checked
 * `Toggle`s for active entries, and `Divider`s.
 */
function NativeMenu({
  label,
  icon,
  items,
  variant = 'filled',
  size = 'medium',
  shape,
  color,
  tone = 'accent',
  iconSize,
  hideLabel,
  disabled,
  pressed,
  testID,
}: MenuProps) {
  // A toggle that is on is drawn filled, whatever its variant.
  const shown = pressed ? 'filled' : variant;
  const themeTint = useColor('tint');
  const themeLabel = useColor('label');
  const themeOnAccent = useColor('onTint');
  // The label tone only applies to the text variant: a tool, not a call to action.
  const accent = color ?? (shown === 'text' && tone === 'label' ? themeLabel : themeTint);
  // A custom accent brings its own contrast color for filled content.
  const onAccent = color ? contrastOf(color) : themeOnAccent;
  const iconColor = shown === 'filled' ? onAccent : accent;
  const modifiers: ViewModifier[] = [
    buttonStyle(VARIANT_STYLE[shown]),
    controlSize(swiftControlSize(size)),
    tint(accent),
  ];
  // A `systemImage` label takes its size from the control size, so an icon
  // sized on its own (a header action's 22pt symbol) is drawn as the label.
  const sizedIcon = hideLabel && icon && iconSize !== undefined;

  if (shape) modifiers.push(buttonBorderShape(swiftBorderShape(shape)));
  if (hideLabel && icon && !sizedIcon) modifiers.push(labelStyle('iconOnly'));
  if (sizedIcon) modifiers.push(accessibilityLabel(label));
  if (disabled) modifiers.push(disabledMod(true));
  // VoiceOver says a toggle that is on is selected.
  if (pressed) modifiers.push(accessibilityAddTraits(['isSelected']));

  return (
    <SwiftUIMenu
      label={sizedIcon
        ? <Image systemName={iosSymbol(icon!)} color={iconColor} size={iconSize}/>
        : label}
      systemImage={icon && !sizedIcon ? iosSymbol(icon) : undefined}
      modifiers={modifiers}
      testID={testID}>
      <MenuItems items={items}/>
    </SwiftUIMenu>
  );
}

/**
 * SwiftUI menu entries shared by `Menu`, `ContextMenu` and `Fab`. A `swatch`
 * entry draws its dot as an image file (`swatch-file.ios.ts`): `UIMenu`
 * draws a symbol in the menu's tint, but keeps the colors of an image, so
 * a palette's entries show their colors. Without the file (no
 * `expo-file-system`) the dot is a symbol in the color, which the menu
 * draws monochrome.
 */
export function MenuItems({items}: {items: MenuItem[]}) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={index}>
          {item.separator && index > 0 ? <Divider/> : null}
          {item.swatch ? (
            <SwatchEntry item={item}/>
          ) : item.active ? (
            // A checked toggle is how a SwiftUI menu shows the current state.
            <Toggle
              isOn
              label={item.label}
              systemImage={item.icon ? iosSymbol(item.icon) : undefined}
              onIsOnChange={() => item.onPress?.()}
              modifiers={item.disabled ? [disabledMod(true)] : undefined}
            />
          ) : (
            <Button
              label={item.label}
              systemImage={item.icon ? iosSymbol(item.icon) : undefined}
              role={item.role === 'destructive' ? 'destructive' : 'default'}
              onPress={item.onPress}
              modifiers={item.disabled ? [disabledMod(true)] : undefined}
            />
          )}
        </Fragment>
      ))}
    </>
  );
}

/** An entry with a color dot before its label, and the check after it when it is the current one. */
function SwatchEntry({item}: {item: MenuItem}) {
  const file = swatchImage(item.swatch!);
  return (
    <Button
      role={item.role === 'destructive' ? 'destructive' : 'default'}
      onPress={item.onPress}
      modifiers={item.disabled ? [disabledMod(true)] : undefined}>
      <HStack spacing={8}>
        {file
          ? <Image uiImage={file} size={SWATCH_SIZE}/>
          : <Image systemName="circle.fill" color={item.swatch} size={SWATCH_SIZE - 2}/>}
        <Text>{item.label}</Text>
        {item.active ? <Image systemName="checkmark" size={SWATCH_SIZE}/> : null}
      </HStack>
    </Button>
  );
}

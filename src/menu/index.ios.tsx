import type {MenuItem, MenuProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Fragment} from 'react';
import {Button, Divider, Image, Menu as SwiftUIMenu, Toggle} from '@expo/ui/swift-ui';
import {accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, disabled as disabledMod, labelStyle, tint} from '@expo/ui/swift-ui/modifiers';
import {iosSymbol, swiftBorderShape, swiftControlSize} from '../button/shared';
import {useColor} from '../theme';

const VARIANT_STYLE = {
  filled: 'borderedProminent',
  outlined: 'bordered',
  text: 'plain',
} as const;

/**
 * iOS renders SwiftUI's `Menu`, styled with the same `buttonStyle` / `tint`
 * mapping as the kit's `Button` so the trigger matches. Entries are SwiftUI
 * `Button`s (with SF Symbol and `destructive` role), checked `Toggle`s for
 * active entries, and `Divider`s.
 */
export function Menu({
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
  testID,
}: MenuProps) {
  const themeTint = useColor('tint');
  const themeLabel = useColor('label');
  const accent = color ?? (variant === 'text' && tone === 'label' ? themeLabel : themeTint);
  const modifiers: ViewModifier[] = [
    buttonStyle(VARIANT_STYLE[variant]),
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

  return (
    <SwiftUIMenu
      label={sizedIcon
        ? <Image systemName={iosSymbol(icon!)} color={accent} size={iconSize}/>
        : label}
      systemImage={icon && !sizedIcon ? iosSymbol(icon) : undefined}
      modifiers={modifiers}
      testID={testID}>
      <MenuItems items={items}/>
    </SwiftUIMenu>
  );
}

/** SwiftUI menu entries shared by `Menu`, `ContextMenu` and `Fab`. */
export function MenuItems({items}: {items: MenuItem[]}) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={index}>
          {item.separator && index > 0 ? <Divider/> : null}
          {item.active ? (
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

import type {MenuItem, MenuProps} from './types';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {Fragment} from 'react';
import {Button, Divider, Menu as SwiftUIMenu} from '@expo/ui/swift-ui';
import {buttonBorderShape, buttonStyle, controlSize, disabled as disabledMod, labelStyle, tint} from '@expo/ui/swift-ui/modifiers';
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
 * `Button`s (with SF Symbol and `destructive` role) and `Divider`s.
 */
export function Menu({
  label,
  icon,
  items,
  variant = 'filled',
  size = 'medium',
  shape,
  color,
  hideLabel,
  disabled,
  testID,
}: MenuProps) {
  const themeTint = useColor('tint');
  const modifiers: ViewModifier[] = [
    buttonStyle(VARIANT_STYLE[variant]),
    controlSize(swiftControlSize(size)),
    tint(color ?? themeTint),
  ];
  if (shape) modifiers.push(buttonBorderShape(swiftBorderShape(shape)));
  if (hideLabel && icon) modifiers.push(labelStyle('iconOnly'));
  if (disabled) modifiers.push(disabledMod(true));

  return (
    <SwiftUIMenu
      label={label}
      systemImage={icon ? iosSymbol(icon) : undefined}
      modifiers={modifiers}
      testID={testID}>
      <MenuItems items={items}/>
    </SwiftUIMenu>
  );
}

/** SwiftUI menu entries shared by `Menu` and `ContextMenu`. */
export function MenuItems({items}: {items: MenuItem[]}) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={index}>
          {item.separator && index > 0 ? <Divider/> : null}
          <Button
            label={item.label}
            systemImage={item.icon ? iosSymbol(item.icon) : undefined}
            role={item.role === 'destructive' ? 'destructive' : 'default'}
            onPress={item.onPress}
            modifiers={item.disabled ? [disabledMod(true)] : undefined}
          />
        </Fragment>
      ))}
    </>
  );
}

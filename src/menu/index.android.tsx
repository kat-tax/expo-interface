import type {MenuItem, MenuProps} from './types';

import {Fragment, useState} from 'react';
import {Box, DropdownMenu, DropdownMenuItem, HorizontalDivider, Icon, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {background, clip, Shapes, size as sizeModifier} from '@expo/ui/jetpack-compose/modifiers';
import {Button} from '../button';
import {useColor} from '../theme';

const ICON_SIZE = 20;
const SWATCH_SIZE = 16;

/**
 * Android anchors a Material 3 `DropdownMenu` to the kit's `Button`. Entries
 * are `DropdownMenuItem`s with an optional drawable leading icon (or a color
 * dot), a trailing check when active; destructive items use the theme
 * danger color.
 */
export function Menu({label, icon, items, testID, trigger: _trigger, onOpenChange, ...button}: MenuProps) {
  const [expanded, setExpanded] = useState(false);
  const setOpen = (open: boolean) => {
    setExpanded(open);
    onOpenChange?.(open);
  };
  return (
    <DropdownMenu expanded={expanded} onDismissRequest={() => setOpen(false)}>
      <DropdownMenu.Trigger>
        <Button
          {...button}
          label={label}
          prefixIcon={icon}
          onPress={() => setOpen(true)}
          testID={testID}
        />
      </DropdownMenu.Trigger>
      <MenuItems items={items} onClose={() => setOpen(false)}/>
    </DropdownMenu>
  );
}

/** Compose `DropdownMenu.Items` shared by `Menu`, `ContextMenu` and `Fab`. */
export function MenuItems({items, onClose}: {items: MenuItem[]; onClose: () => void}) {
  const colors = useMaterialColors();
  const destructive = useColor('destructive');
  const separator = useColor('separator');
  return (
    <DropdownMenu.Items>
      {items.map((item, index) => {
        const color = item.role === 'destructive' ? destructive : colors.onSurface;
        const contentColor = item.disabled ? colors.onSurfaceVariant : color;
        return (
          <Fragment key={index}>
            {item.separator && index > 0 ? <HorizontalDivider color={separator}/> : null}
            <DropdownMenuItem
              enabled={!item.disabled}
              elementColors={{textColor: color, leadingIconColor: color, trailingIconColor: color}}
              onClick={item.disabled ? undefined : () => {
                onClose();
                item.onPress?.();
              }}>
              {item.swatch ? (
                <DropdownMenuItem.LeadingIcon>
                  <Box modifiers={[sizeModifier(SWATCH_SIZE, SWATCH_SIZE), clip(Shapes.Circle), background(item.swatch)]}/>
                </DropdownMenuItem.LeadingIcon>
              ) : item.icon?.drawable ? (
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={item.icon.drawable} size={ICON_SIZE} tint={contentColor}/>
                </DropdownMenuItem.LeadingIcon>
              ) : null}
              <DropdownMenuItem.Text>
                <Text color={contentColor}>{item.label}</Text>
              </DropdownMenuItem.Text>
              {item.active ? (
                <DropdownMenuItem.TrailingIcon>
                  <Text color={contentColor}>✓</Text>
                </DropdownMenuItem.TrailingIcon>
              ) : null}
            </DropdownMenuItem>
          </Fragment>
        );
      })}
    </DropdownMenu.Items>
  );
}

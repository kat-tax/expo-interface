import type {MenuItem, MenuProps} from './types';

import {Fragment, useState} from 'react';
import {DropdownMenu, DropdownMenuItem, HorizontalDivider, Icon, Text, useMaterialColors} from '@expo/ui/jetpack-compose';
import {Button} from '../button';
import {useColor} from '../theme';

const ICON_SIZE = 20;

/**
 * Android anchors a Material 3 `DropdownMenu` to the kit's `Button`. Entries
 * are `DropdownMenuItem`s with an optional drawable leading icon; destructive
 * items use the theme danger color.
 */
export function Menu({label, icon, items, testID, ...button}: MenuProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
      <DropdownMenu.Trigger>
        <Button
          {...button}
          label={label}
          prefixIcon={icon}
          onPress={() => setExpanded(true)}
          testID={testID}
        />
      </DropdownMenu.Trigger>
      <MenuItems items={items} onClose={() => setExpanded(false)}/>
    </DropdownMenu>
  );
}

/** Compose `DropdownMenu.Items` shared by `Menu` and `ContextMenu`. */
export function MenuItems({items, onClose}: {items: MenuItem[]; onClose: () => void}) {
  const colors = useMaterialColors();
  const destructive = useColor('destructive');
  const separator = useColor('separator');
  return (
    <DropdownMenu.Items>
      {items.map((item, index) => {
        const color = item.role === 'destructive' ? destructive : colors.onSurface;
        return (
          <Fragment key={index}>
            {item.separator && index > 0 ? <HorizontalDivider color={separator}/> : null}
            <DropdownMenuItem
              enabled={!item.disabled}
              elementColors={{textColor: color, leadingIconColor: color}}
              onClick={item.disabled ? undefined : () => {
                onClose();
                item.onPress?.();
              }}>
              {item.icon?.drawable ? (
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={item.icon.drawable} size={ICON_SIZE} tint={item.disabled ? colors.onSurfaceVariant : color}/>
                </DropdownMenuItem.LeadingIcon>
              ) : null}
              <DropdownMenuItem.Text>
                <Text color={item.disabled ? colors.onSurfaceVariant : color}>{item.label}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          </Fragment>
        );
      })}
    </DropdownMenu.Items>
  );
}

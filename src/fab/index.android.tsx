import type {ModifierConfig} from '@expo/ui/jetpack-compose/modifiers';
import type {FabProps, FabSize} from './types';

import {useState} from 'react';
import {
  DropdownMenu,
  ExtendedFloatingActionButton,
  FloatingActionButton,
  Icon,
  LargeFloatingActionButton,
  SmallFloatingActionButton,
  Text,
} from '@expo/ui/jetpack-compose';
import {alpha, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost} from '../host';
import {MenuItems} from '../menu/index.android';
import {useColor} from '../theme';
import {FAB_ICON} from './shared';

const VARIANT: Record<FabSize, typeof FloatingActionButton> = {
  small: SmallFloatingActionButton,
  regular: FloatingActionButton,
  large: LargeFloatingActionButton,
  extended: ExtendedFloatingActionButton,
};

/**
 * Android renders the Material 3 `FloatingActionButton` family, filled with
 * the accent (the container color) and the icon in `onTint`, inside its own
 * accent-seeded host so it can float over a React Native screen. With
 * `items` the button is the trigger of the same Compose `DropdownMenu` the
 * kit's `Menu` anchors, so the menu is shared and only the trigger differs.
 */
export function Fab({label, icon, onPress, items, size = 'regular', disabled, testID}: FabProps) {
  const tint = useColor('tint');
  const onTint = useColor('onTint');
  const [expanded, setExpanded] = useState(false);
  const Component = VARIANT[size];
  const modifiers: ModifierConfig[] = [];
  if (disabled) modifiers.push(alpha(0.4));
  if (testID) modifiers.push(testIDModifier(testID));
  const press = items ? () => setExpanded(true) : onPress;

  const button = (
    <Component containerColor={tint} onClick={disabled ? undefined : press} modifiers={modifiers}>
      <FloatingActionButton.Icon>
        {icon.drawable ? (
          <Icon source={icon.drawable} size={FAB_ICON[size]} tint={onTint} contentDescription={label}/>
        ) : (
          // No drawable registered for this icon (see `icon()`): the label stands in.
          <Text color={onTint}>{label.slice(0, 1)}</Text>
        )}
      </FloatingActionButton.Icon>
      {size === 'extended' ? (
        <ExtendedFloatingActionButton.Text>
          <Text color={onTint} style={{fontWeight: '600'}}>{label}</Text>
        </ExtendedFloatingActionButton.Text>
      ) : null}
    </Component>
  );

  return (
    <NativeHost fit>
      {items ? (
        <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
          <DropdownMenu.Trigger>{button}</DropdownMenu.Trigger>
          <MenuItems items={items} onClose={() => setExpanded(false)}/>
        </DropdownMenu>
      ) : button}
    </NativeHost>
  );
}

import type {PickerProps, PickerValue} from './types';

import {useState} from 'react';
import unfoldMore from '@expo/material-symbols/unfold_more.xml';
import {useMaterialColors, DropdownMenu, DropdownMenuItem, Column, Row, Text, Icon} from '@expo/ui/jetpack-compose';
import {background, clickable, clip, fillMaxWidth, padding, Shapes, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {extractItems, labelFor, PickerItem, useSelectedValue} from './shared';

/**
 * Android's stock dropdown spans the full row width with no label, so instead
 * the row mirrors the iOS Form look — a leading label and a trailing rounded
 * pill showing the value plus an up/down chevron — built with Jetpack Compose
 * primitives so it lives natively inside the surrounding `Host`/`FieldGroup`.
 * Pressing the pill anchors a Material dropdown menu of the options.
 */
function PickerComponent<T extends PickerValue>({
  label,
  children,
  disabled,
  accentColor,
  selectedValue,
  onValueChange,
  testID,
}: PickerProps<T>) {
  const colors = useMaterialColors();
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const [expanded, setExpanded] = useState(false);
  const colorLabel = disabled ? colors.onSurfaceVariant : colors.onSurface;
  // Secondary by default — iOS renders the menu picker's value in gray inside
  // a Form, and the web pill uses `secondaryLabel` to match.
  const colorValue = accentColor && !disabled ? accentColor : colors.onSurfaceVariant;
  return (
    <Column modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
      <Row
        verticalAlignment="center"
        horizontalArrangement="spaceBetween"
        modifiers={[fillMaxWidth()]}>
        {label != null ? <Text color={colorLabel}>{label}</Text> : null}
        <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
          <DropdownMenu.Trigger>
            <Row
              verticalAlignment="center"
              horizontalArrangement={{spacedBy: 4}}
              modifiers={[
                clip(Shapes.RoundedCorner(8)),
                background(colors.surfaceContainerHighest),
                ...(disabled ? [] : [clickable(() => setExpanded(true))]),
                padding(12, 6, 12, 6),
              ]}>
              <Text color={colorValue}>{labelFor(items, current)}</Text>
              <Icon source={unfoldMore} size={16} tint={colorValue} />
            </Row>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {items.map(item => (
              <DropdownMenuItem
                key={String(item.value)}
                onClick={
                  disabled
                    ? undefined
                    : () => {
                        setValue(item.value);
                        setExpanded(false);
                      }
                }>
                <DropdownMenuItem.Text>
                  <Text>{item.label}</Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </Row>
    </Column>
  );
}

PickerComponent.Item = PickerItem;

export {PickerComponent as Picker};

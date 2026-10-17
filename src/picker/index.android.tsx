import type {PickerProps, PickerValue} from './types';

import {useState} from 'react';
import unfoldMore from '@expo/material-symbols/unfold_more.xml';
import {
  useMaterialColors,
  DropdownMenuItem,
  ExposedDropdownMenu,
  ExposedDropdownMenuBox,
  Column,
  Row,
  Surface,
  Text,
  Icon,
} from '@expo/ui/jetpack-compose';
import {background, clip, fillMaxWidth, menuAnchor, padding, Shapes, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {extractItems, labelFor, PickerItem, useSelectedValue} from './shared';

const CLEAR = '#00000000';

/** The surface's click, which is there for its semantics: the anchor's own press opens the menu. */
const inert = () => {};

/**
 * Android's stock dropdown spans the full row width with no label, so instead
 * the row mirrors the iOS Form look — a leading label and a trailing rounded
 * pill showing the value plus an up/down chevron — built with Jetpack Compose
 * primitives so it lives natively inside the surrounding `Host`/`FieldGroup`.
 *
 * The whole row anchors Material's exposed drop-down, so it is the one node
 * with the drop-down role, read as the label then the value, and the menu is
 * the row's width, Material's own idiom. The anchor's semantics merge
 * nothing, and Compose reports no role for a node whose texts are not merged
 * into it, so the row is a clickable `Surface`: its click merges the texts and
 * carries the disabled state, and does nothing, since the anchor's own press
 * opens the menu. The anchor stays enabled while the picker is disabled, as
 * `menuAnchor(…, false)` takes the drop-down role away with the press, and
 * the box refuses to open instead.
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
  const open = expanded && !disabled;
  const colorLabel = disabled ? colors.onSurfaceVariant : colors.onSurface;
  // Secondary by default — iOS renders the menu picker's value in gray inside
  // a Form, and the web pill uses `secondaryLabel` to match.
  const colorValue = accentColor && !disabled ? accentColor : colors.onSurfaceVariant;
  return (
    <Column modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
      <ExposedDropdownMenuBox
        expanded={open}
        onExpandedChange={disabled ? undefined : setExpanded}
        modifiers={[fillMaxWidth()]}>
        <Surface
          color={CLEAR}
          enabled={!disabled}
          onClick={inert}
          modifiers={[menuAnchor('primaryNotEditable'), fillMaxWidth()]}>
          <Row
            verticalAlignment="center"
            horizontalArrangement="spaceBetween"
            modifiers={[fillMaxWidth()]}>
            {label != null ? <Text color={colorLabel}>{label}</Text> : null}
            <Row
              verticalAlignment="center"
              horizontalArrangement={{spacedBy: 4}}
              modifiers={[
                clip(Shapes.RoundedCorner(8)),
                background(colors.surfaceContainerHighest),
                padding(12, 6, 12, 6),
              ]}>
              <Text color={colorValue}>{labelFor(items, current)}</Text>
              <Icon source={unfoldMore} size={16} tint={colorValue} />
            </Row>
          </Row>
        </Surface>
        <ExposedDropdownMenu expanded={open} onDismissRequest={() => setExpanded(false)}>
          {items.map(item => (
            <DropdownMenuItem
              key={String(item.value)}
              onClick={() => {
                setValue(item.value);
                setExpanded(false);
              }}>
              <DropdownMenuItem.Text>
                <Text>{item.label}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </ExposedDropdownMenu>
      </ExposedDropdownMenuBox>
    </Column>
  );
}

PickerComponent.Item = PickerItem;

export {PickerComponent as Picker};

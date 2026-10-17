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
import {
  alpha,
  background,
  clip,
  fillMaxWidth,
  height,
  menuAnchor,
  onSizeChanged,
  padding,
  semantics,
  Shapes,
  testID as testIDModifier,
} from '@expo/ui/jetpack-compose/modifiers';
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
 * The row anchors Material's exposed drop-down, so the menu is the row's
 * width, Material's own idiom, and a press anywhere on it opens the menu.
 * The control a screen reader is handed is the anchor, laid over the row
 * between the label and the value. Compose reports a node's role only where
 * the node has no semantic children, and moves it to a child of its own where
 * it has some, so the anchor is a clear `Surface` with none: the drop-down
 * role, the label as its content description, the disabled state, the press
 * and the testID, all on one node. Its click is there for its semantics and does
 * nothing, since the anchor's own press opens the menu. Compose leaves out of
 * the tree what a node drawn over it covers, so the label under the anchor
 * is not read twice, while the value is drawn over the anchor, read as text
 * after it, and takes no press of its own. The anchor stays enabled while the
 * picker is disabled, as `menuAnchor(…, false)` takes the drop-down role
 * away with the press, and the box refuses to open instead.
 *
 * The box lays its children over one another but gives them no `Box` scope,
 * so the anchor and the value take the height the row under them reports.
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
  const [rowHeight, setRowHeight] = useState<number>();
  const open = expanded && !disabled;
  const colorLabel = disabled ? colors.onSurfaceVariant : colors.onSurface;
  // Secondary by default — iOS renders the menu picker's value in gray inside
  // a Form, and the web pill uses `secondaryLabel` to match.
  const colorValue = accentColor && !disabled ? accentColor : colors.onSurfaceVariant;
  const pill = (shown: boolean) => (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{spacedBy: 4}}
      modifiers={[
        clip(Shapes.RoundedCorner(8)),
        background(colors.surfaceContainerHighest),
        padding(12, 6, 12, 6),
        ...(shown ? [] : [alpha(0)]),
      ]}>
      <Text color={colorValue}>{labelFor(items, current)}</Text>
      <Icon source={unfoldMore} size={16} tint={colorValue} />
    </Row>
  );
  const tall = rowHeight !== undefined ? [height(rowHeight)] : [];
  return (
    <Column modifiers={[fillMaxWidth()]}>
      <ExposedDropdownMenuBox
        expanded={open}
        onExpandedChange={disabled ? undefined : setExpanded}
        modifiers={[fillMaxWidth()]}>
        <Row
          verticalAlignment="center"
          horizontalArrangement="spaceBetween"
          modifiers={[fillMaxWidth(), onSizeChanged(({height: down}) => setRowHeight(down))]}>
          {label != null ? <Text color={colorLabel}>{label}</Text> : null}
          {pill(false)}
        </Row>
        <Surface
          color={CLEAR}
          enabled={!disabled}
          onClick={inert}
          modifiers={[
            menuAnchor('primaryNotEditable'),
            fillMaxWidth(),
            ...tall,
            ...(label != null ? [semantics({contentDescription: label})] : []),
            ...(testID ? [testIDModifier(testID)] : []),
          ]}
        />
        <Row
          verticalAlignment="center"
          horizontalArrangement="end"
          modifiers={[fillMaxWidth(), ...tall]}>
          {pill(true)}
        </Row>
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

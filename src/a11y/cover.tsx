import {Box, Surface} from '@expo/ui/jetpack-compose';
import {matchParentSize, semantics, testID as testIDModifier, toggleable} from '@expo/ui/jetpack-compose/modifiers';

const CLEAR = '#00000000';

/** What a disabled cover is handed: its presses change nothing. */
const inert = () => {};

export interface ToggleCoverProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** The role the cover is reported with. */
  role: 'switch' | 'checkbox';
  /** The name, which the row draws beside the control. */
  label?: string;
  testID?: string;
}

/**
 * The Android control a screen reader is handed for a row that draws a
 * Material switch or checkbox and its label: a node laid over the row, the
 * last child of a `Box` around it.
 *
 * Compose reports a node's role only where the node has no semantic
 * children, and moves the role and content description of a node that
 * merges to children of their own where it has some
 * (`SemanticsNode.emitFakeNodes`). A row that toggles holds its label's
 * text, and the Material switch holds its thumb, whose `background` is a
 * semantics node. The cover has no children, so its one node carries the
 * role, the label as its content description, the state, the press and the
 * testID. Compose leaves out of the tree what a node drawn over it covers, so
 * the label and the control under it, which only draw, are not read as well.
 *
 * `@expo/ui`'s `toggleable` takes no `enabled`, so a disabled cover is a
 * toggleable `Surface` that is not enabled, which is reported disabled and
 * offers a screen reader no click, carrying the `toggleable` for its role.
 * A press still reaches that `toggleable`, which changes nothing here, and
 * its ripple takes the surface's content color, which is clear.
 */
export function ToggleCover({value, onValueChange, disabled, role, label, testID}: ToggleCoverProps) {
  const modifiers = [
    matchParentSize(),
    toggleable(value, disabled ? inert : () => onValueChange(!value), {role}),
    ...(label != null ? [semantics({contentDescription: label})] : []),
    ...(testID ? [testIDModifier(testID)] : []),
  ];
  if (!disabled) return <Box modifiers={modifiers}/>;
  return <Surface color={CLEAR} contentColor={CLEAR} checked={value} onCheckedChange={inert} enabled={false} modifiers={modifiers}/>;
}

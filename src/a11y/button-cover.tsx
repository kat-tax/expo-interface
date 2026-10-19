import type {ShapeJSXElement} from '@expo/ui/jetpack-compose';
import {TextButton} from '@expo/ui/jetpack-compose';
import {matchParentSize, semantics, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';

const CLEAR = '#00000000';

export interface ButtonCoverProps {
  onPress: () => void;
  disabled?: boolean;
  /** The name, which the content under the cover draws. */
  label: string;
  /** The ripple's color: the content color of what it covers. */
  color: string;
  /** The ripple's outline: the shape of what it covers. */
  shape: ShapeJSXElement;
  testID?: string;
}

/**
 * The Android control a screen reader is handed for content the kit draws
 * that presses as a button (a row, a well): a node laid over it, the last
 * child of a `Box` around it, clear but for its ripple.
 *
 * `@expo/ui`'s `clickable` takes no role, and a role on a node with
 * semantic children moves to a child of its own (see `ToggleCover`).
 * Material's buttons report the button role on their own node, so the cover
 * is a `TextButton` with no content: its one node carries the role, the
 * label as its content description, the disabled state, the press and the
 * testID. Compose leaves out of the tree what a node drawn over it covers,
 * so what is under the cover, which only draws, is not read as well.
 */
export function ButtonCover({onPress, disabled, label, color, shape, testID}: ButtonCoverProps) {
  return (
    <TextButton
      onClick={onPress}
      enabled={!disabled}
      shape={shape}
      colors={{containerColor: CLEAR, contentColor: color, disabledContainerColor: CLEAR, disabledContentColor: CLEAR}}
      modifiers={[matchParentSize(), semantics({contentDescription: label}), ...(testID ? [testIDModifier(testID)] : [])]}>
      {null}
    </TextButton>
  );
}

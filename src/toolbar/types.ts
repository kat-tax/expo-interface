import type {PropsWithChildren, ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/** Which edge of its content a `Toolbar` sits on, and so where its rule goes. */
export type ToolbarPlacement = 'top' | 'bottom';

/**
 * A bar of tools along a canvas: the editor's status bar, the strip over a
 * drawing, the row under a preview.
 *
 * The controls are one native view — a `Row` inside a single host — so a bar
 * of buttons and menus costs one bridge crossing rather than one per group.
 * Put a `Divider vertical` between groups; both slots take the kit's own
 * controls, which draw natively inside the host.
 *
 * A `field` breaks that in one place: a text field is a React Native input,
 * so with one the bar is a leading host, the field, and a trailing host.
 */
export interface ToolbarProps extends PropsWithChildren {
  /** Controls at the leading edge. */
  leading?: ReactNode;
  /** Controls at the trailing edge. */
  trailing?: ReactNode;
  /**
   * A field between the two groups — a `TextField variant="inline"` for a
   * search or a prompt. It grows into the space the controls leave.
   */
  field?: ReactNode;
  /**
   * Which edge the bar sits on: the rule goes on the side facing the
   * content.
   * @default 'bottom'
   */
  placement?: ToolbarPlacement;
  /** A second row under the controls: peers, counts, a progress bar. */
  children?: ReactNode;
  /** Style applied to the bar. */
  style?: StyleProp<ViewStyle>;
  /** Identifier used to locate the bar in end-to-end tests. */
  testID?: string;
}

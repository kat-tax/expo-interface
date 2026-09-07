import type {PropsWithChildren, ReactNode} from 'react';

/** A rectangle in the coordinates of the content a `Popover` is laid over. */
export interface PopoverRect {
  x: number;
  y: number;
  /** @default 0 */
  width?: number;
  /** @default 0 */
  height?: number;
}

/** One of the buttons under a popover's message. */
export interface PopoverAction {
  label: string;
  onPress: () => void;
  /** `destructive` draws the chip in the danger color. */
  role?: 'default' | 'destructive';
}

/**
 * A card pointing at something on a canvas: a spelling suggestion, a note on
 * a block, a warning about a link. Laid over its parent at `at` and kept
 * inside it, flipping above the rectangle when there is no room below.
 *
 * Drawn with the kit's `Surface` and typography on every platform (the
 * actions are native buttons in a host of their own), because what it points
 * at is a canvas the kit did not draw. For a menu at a point, use
 * `PopupMenu`, which is the platform's own.
 */
export interface PopoverProps extends PropsWithChildren {
  /** The rectangle to point at. `null` hides the popover. */
  at: PopoverRect | null;
  /** Bold first line. */
  title?: string;
  /** Body text under the title. */
  message?: string;
  /** Buttons under the message. */
  actions?: PopoverAction[];
  /** Called after an action is taken. */
  onDismiss?: () => void;
  /**
   * Width of the card in points.
   * @default 280
   */
  width?: number;
  /** Extra content under the message, above the actions. */
  children?: ReactNode;
  /** Identifier used to locate the popover in end-to-end tests. */
  testID?: string;
}

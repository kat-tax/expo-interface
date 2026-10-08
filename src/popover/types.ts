import type {PropsWithChildren, ReactNode} from 'react';
import type {AnchorInsets, AnchorRect} from '../anchored';

/** A rectangle in the coordinates of the content a `Popover` is laid over. */
export type PopoverRect = AnchorRect;

/** What the card keeps clear of at its parent's edges. */
export type PopoverInsets = AnchorInsets;

/** One of the buttons under a popover's message. */
export interface PopoverAction {
  label: string;
  onPress: () => void;
  /** `destructive` draws the chip in the danger color. */
  role?: 'default' | 'destructive';
}

/**
 * Why a popover asks to close: one of its actions was taken, the backdrop of
 * a modal one (or, on Windows, outside the platform's tip) was pressed,
 * Escape was pressed on web, or the pointer left a hover popover and stayed
 * away for its grace.
 */
export type PopoverDismissReason = 'action' | 'backdrop' | 'escape' | 'leave';

/**
 * A card pointing at something on a canvas: a spelling suggestion, a note on
 * a block, a warning about a link, the editor of an option. Laid over its
 * parent at `at` and kept inside it, flipping above the rectangle when there
 * is no room below.
 *
 * Drawn with the kit's `Surface` and typography on every platform (the
 * actions are native buttons in a host of their own), because what it points
 * at is a canvas the kit did not draw. For a menu at a point, use
 * `PopupMenu`, which is the platform's own.
 */
export interface PopoverProps extends PropsWithChildren {
  /**
   * The rectangle to point at. `null` hides the popover. A new object for
   * the same rectangle, passed on every render, changes nothing.
   */
  at: PopoverRect | null;
  /** Bold first line. */
  title?: string;
  /** Body text under the title. */
  message?: string;
  /** Buttons under the message. */
  actions?: PopoverAction[];
  /**
   * Called when the popover closes, with why. On web the card takes Escape,
   * which then goes no further, only when there is an `onDismiss` to report
   * it to or while a `hover` card lingers.
   */
  onDismiss?: (reason: PopoverDismissReason) => void;
  /**
   * Which side of the rectangle the card prefers. It still moves when there
   * is no room there, on every platform — this says what to try first.
   *
   * Only the two vertical edges: the drawn card places itself above or below,
   * and offering a side it cannot reach would be a prop that silently does
   * nothing on three platforms out of four.
   * @default 'auto'
   */
  preferredEdge?: 'auto' | 'top' | 'bottom';
  /**
   * Width of the card in points.
   * @default 280
   */
  width?: number;
  /**
   * A backdrop over the parent while the card is up: a press on it reports
   * `backdrop` through `onDismiss`, and nothing under it takes the press.
   * For a card with controls in it, an option's editor. The card says it is
   * a dialog, named on web by `label` or the title.
   * @default false
   */
  modal?: boolean;
  /**
   * What a screen reader calls a `modal` card on web: for one without a
   * `title`, or with a title that does not say what it is for. Defaults to
   * `title`. iOS, Android and Windows read what the card holds instead.
   */
  label?: string;
  /**
   * What the card keeps clear of at the parent's edges: a header over the
   * canvas, a bar under it.
   */
  insets?: PopoverInsets;
  /**
   * `hover` is a card about what is under the pointer, a word with a
   * spelling mark: the app sets `at` while the pointer is over the word and
   * clears it when the pointer leaves, and the card lingers on the last
   * rectangle for `grace` after that and stays while the pointer is over the
   * card, so the pointer can cross onto it. Once the pointer has been away
   * from both for the grace the card goes, reporting `leave` through
   * `onDismiss`. A touch is not a hover: a finger on the card does not keep
   * it, and lifting one off does not count as leaving.
   *
   * An action, the backdrop or Escape ends the linger, so the card goes as
   * soon as the app clears `at`. While it lingers the card draws the title,
   * message, actions and children it is given then: clear only `at` when the
   * pointer leaves, and keep the rest until `onDismiss` says the card has
   * gone.
   * @default 'manual'
   */
  trigger?: 'manual' | 'hover';
  /**
   * How long a `hover` card lingers once the pointer has gone, in
   * milliseconds.
   * @default 300
   */
  grace?: number;
  /** Extra content under the message, above the actions. */
  children?: ReactNode;
  /** Identifier used to locate the popover in end-to-end tests. */
  testID?: string;
}

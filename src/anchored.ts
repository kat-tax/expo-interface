import type {LayoutChangeEvent} from 'react-native';
import {useState} from 'react';

/** A rectangle in the coordinates of the content an overlay is laid over. */
export interface AnchorRect {
  x: number;
  y: number;
  /** @default 0 */
  width?: number;
  /** @default 0 */
  height?: number;
}

/** Which side of the rectangle an anchored card prefers. */
export type AnchorEdge = 'auto' | 'top' | 'bottom';

/** What an anchored card keeps clear of at its parent's edges: a header over the canvas, a bar under it. */
export interface AnchorInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface AnchoredOptions {
  /** The rectangle to sit beside; `null` while there is nothing. */
  at: AnchorRect | null;
  /**
   * Which edge to try first. It is a preference, not a promise: with no room
   * on that edge the card goes to the other, since a card off the screen is
   * worse than one on the other side.
   * @default 'auto'
   */
  preferredEdge?: AnchorEdge;
  /** The card's width, when it is known before it is laid out. */
  width?: number;
  /** What to keep clear of at the parent's edges. */
  insets?: AnchorInsets;
  /**
   * Space between the rectangle and the card, and from the parent's edges.
   * @default 8
   */
  gap?: number;
}

interface Anchored {
  /** Measures the parent the card is laid over. */
  onBounds: (event: LayoutChangeEvent) => void;
  /** Measures the card. */
  onCard: (event: LayoutChangeEvent) => void;
  /** Where the card goes, in the parent's coordinates. */
  left: number;
  top: number;
  /** Whether the card ended up above the rectangle. */
  above: boolean;
  /** Whether both the parent and the card have been measured, so the place is final. */
  placed: boolean;
}

/**
 * Where a card anchored to a rectangle goes inside the parent it is laid
 * over: below the rectangle, or above it when the bottom is too close, and
 * never past the parent's edges less its insets. One rule for every overlay
 * that points at something on a canvas: a `Popover`, a floating `Toolbar`.
 *
 * The parent and the card are measured as they lay out; until both have
 * been, the card is placed from what is known, and it settles once they
 * are (`placed`).
 */
export function useAnchored({at, preferredEdge = 'auto', width, insets, gap = 8}: AnchoredOptions): Anchored {
  const [bounds, setBounds] = useState({width: 0, height: 0});
  const [card, setCard] = useState({width: width ?? 0, height: 0});
  const onBounds = (event: LayoutChangeEvent) => {
    const {width: w, height: h} = event.nativeEvent.layout;
    if (w !== bounds.width || h !== bounds.height) setBounds({width: w, height: h});
  };
  const onCard = (event: LayoutChangeEvent) => {
    const {width: w, height: h} = event.nativeEvent.layout;
    const nextWidth = width ?? w;
    if (nextWidth !== card.width || h !== card.height) setCard({width: nextWidth, height: h});
  };

  const top0 = (insets?.top ?? 0) + gap;
  const left0 = (insets?.left ?? 0) + gap;
  const bottomEdge = bounds.height - (insets?.bottom ?? 0) - gap;
  const rightEdge = bounds.width - (insets?.right ?? 0) - gap;

  const below = at ? at.y + (at.height ?? 0) + gap : 0;
  // Above the rectangle when it was asked for, or when the card would run past
  // the bottom edge. A preference is only that: asking for the top and having
  // no room there still puts the card below.
  const noRoomBelow = !!at && bounds.height > 0 && below + card.height > bottomEdge;
  const roomAbove = !!at && at.y - card.height - gap >= top0;
  const above = preferredEdge === 'top' ? (roomAbove || noRoomBelow) : preferredEdge === 'bottom' ? noRoomBelow && roomAbove : noRoomBelow;
  const top = at ? (above ? Math.max(top0, at.y - card.height - gap) : below) : 0;
  // Until the parent has been measured there is nothing to clamp against.
  const rightMost = bounds.width > 0 ? Math.max(left0, rightEdge - card.width) : Infinity;
  const left = at ? Math.max(left0, Math.min(at.x, rightMost)) : 0;

  return {onBounds, onCard, left, top, above, placed: bounds.height > 0 && card.height > 0};
}

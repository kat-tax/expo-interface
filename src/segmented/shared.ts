import type {SegmentedControlShape, SegmentedControlSize} from './types';

/**
 * Geometry of the segmented control, in points (iOS), dp (Android) and CSS
 * pixels (web) — the same numbers on every platform, measured from the iOS
 * `UISegmentedControl`. `medium` is the system size: a 32pt track with a 9pt
 * corner, holding a 28pt segment with a 7pt corner and a 13pt label.
 *
 * iOS renders the real system control and takes only `controlSize`/`clipShape`
 * from these; web and Android lay the control out from them directly.
 */

/** Outer height of the track. */
export const SIZE_HEIGHT: Record<SegmentedControlSize, number> = {
  small: 28,
  medium: 32,
  large: 40,
};

/** Corner radius of the track in the `rounded` shape (`pill` is half the height). */
export const SIZE_RADIUS: Record<SegmentedControlSize, number> = {
  small: 8,
  medium: 9,
  large: 11,
};

/** Label size. */
export const SIZE_TEXT: Record<SegmentedControlSize, number> = {
  small: 12,
  medium: 13,
  large: 15,
};

/** Horizontal padding inside a segment. */
export const SIZE_PADDING: Record<SegmentedControlSize, number> = {
  small: 10,
  medium: 12,
  large: 16,
};

/** Narrowest a segment goes, so a one-character label still reads as a target. */
export const SIZE_MIN_WIDTH: Record<SegmentedControlSize, number> = {
  small: 40,
  medium: 48,
  large: 56,
};

/** Gap between the track and its segments, on every edge. */
export const TRACK_INSET = 2;

/** The `controlSize` a size maps to on iOS. */
export function swiftControlSize(size: SegmentedControlSize) {
  return ({small: 'small', medium: 'regular', large: 'large'} as const)[size];
}

/**
 * The resolved measurements of one control. The segment is the track inset by
 * `TRACK_INSET` on every edge, so its corner is the track's less that inset —
 * concentric, the way the iOS indicator sits inside its track.
 * @param size - Control size.
 * @param shape - Border shape; `pill` rounds the track to a half-height capsule.
 * @returns Track and segment geometry, plus the label and padding sizes.
 */
export function metrics(size: SegmentedControlSize, shape: SegmentedControlShape) {
  const height = SIZE_HEIGHT[size];
  const radius = shape === 'pill' ? height / 2 : SIZE_RADIUS[size];
  return {
    height,
    radius,
    segmentHeight: height - TRACK_INSET * 2,
    segmentRadius: Math.max(radius - TRACK_INSET, 0),
    fontSize: SIZE_TEXT[size],
    padding: SIZE_PADDING[size],
    minWidth: SIZE_MIN_WIDTH[size],
  };
}

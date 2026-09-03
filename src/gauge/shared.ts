/**
 * Geometry of the SwiftUI gauge styles, in points, measured from iOS
 * screenshots so the Android and web redraws match the native control.
 */
export const gauge = {
  /** Body text of the labels (the SwiftUI default font). */
  fontSize: 17,
  lineHeight: 22,
  /** Space between a bounds label and the bar. */
  rowGap: 8,

  /** `automatic`: capacity bar height and the gaps to the labels above/below. */
  automatic: {bar: 15, gapAbove: 14, gapBelow: 9},

  /** `linear`: bar height, marker dot (same size) and its background knockout. */
  linear: {bar: 7.5, dot: 7.5, knockout: 15},

  /** `linearCapacity`: bar height, stack spacing and the current value font. */
  linearCapacity: {bar: 4, gap: 4, currentFontSize: 12, currentLineHeight: 16},

  /** Circular styles: ring diameter/stroke, arc, marker and label metrics. */
  ring: {
    size: 58,
    stroke: 5.5,
    /** Open ring (`circular`): arc start angle (degrees, clockwise from 3 o'clock) and sweep. */
    arcStart: 150,
    arcSweep: 240,
    dot: 5.5,
    knockout: 10,
    centerFontSize: 24,
    centerLineHeight: 29,
    boundsFontSize: 10,
    boundsLineHeight: 12,
    /**
     * Width of the bounds row and the offset of its center below the ring
     * center: clear of the 24pt value above it and inside the arc's gap.
     */
    boundsWidth: 34,
    boundsOffset: 17,
    /** Opacity of the unfilled track in `circularCapacity`. */
    trackOpacity: 0.3,
  },
} as const;

/**
 * Unfilled track fills, as `#RRGGBBAA` per scheme: iOS `tertiarySystemFill`
 * behind the `automatic` bar and `systemFill` behind the `linearCapacity` bar.
 */
export const track = {
  automatic: {light: '#7676801F', dark: '#7676803D'},
  linearCapacity: {light: '#78788033', dark: '#7878805C'},
} as const;

/** Position of `value` within `[min, max]`, clamped to `0…1`. */
export function fraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * Center of the `circular` marker for a fraction, relative to the ring center
 * (y grows downwards), on the stroke's center line.
 */
export function markerOffset(f: number): {x: number; y: number} {
  const angle = ((gauge.ring.arcStart + f * gauge.ring.arcSweep) * Math.PI) / 180;
  const radius = (gauge.ring.size - gauge.ring.stroke) / 2;
  return {x: radius * Math.cos(angle), y: radius * Math.sin(angle)};
}

/**
 * `#RRGGBB` (or `#RGB`/`#RRGGBBAA`) color with its alpha replaced. Other
 * color syntaxes are returned unchanged.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color.trim())?.[1];
  if (!hex) return color;
  const rgb = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex.slice(0, 6);
  return `#${rgb}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`.toUpperCase();
}

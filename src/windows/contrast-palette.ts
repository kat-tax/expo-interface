import type {Palette} from '../theme';

/** The system's colours for the parts of a window while a high contrast theme is on, as CSS hex. */
export interface HighContrastColors {
  /** The window's background, and the text on it. */
  background: string;
  text: string;
  /** A selection, and the text on it. */
  highlight: string;
  highlightText: string;
  /** A control's face, and the text on it. */
  buttonFace: string;
  buttonText: string;
  /** A link. */
  link: string;
  /** Disabled text. */
  disabledText: string;
}

export interface HighContrast {
  /** Whether the user has a high contrast theme on. */
  enabled: boolean;
  /** The theme's name ("High Contrast Black"), empty while none is on. */
  scheme: string;
  /** The theme's colours while one is on, otherwise null. */
  colors: HighContrastColors | null;
}

export const NO_CONTRAST: HighContrast = {enabled: false, scheme: '', colors: null};

/**
 * The kit's palette in a high contrast theme's colours: text and separators
 * in the theme's text colour, surfaces in its window and control faces, the
 * accent its highlight. A selected surface is a control face — the theme's
 * highlight is for text drawn in its highlight text, which the kit's labels
 * are not — so a selection shows through its outline, as high contrast
 * themes mean it to.
 */
export function highContrastPalette(colors: HighContrastColors): Palette {
  return {
    label: colors.text,
    secondaryLabel: colors.text,
    tertiaryLabel: colors.disabledText,
    background: colors.background,
    backgroundElement: colors.buttonFace,
    backgroundSelected: colors.buttonFace,
    separator: colors.text,
    tint: colors.highlight,
    onTint: colors.highlightText,
    pillBackground: colors.buttonFace,
    segmentSelected: colors.buttonFace,
    switchTrack: colors.buttonFace,
    switchOn: colors.highlight,
    destructive: colors.text,
    onDestructive: colors.background,
  };
}

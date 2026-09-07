import type {FabSize} from './types';

/** Side of the square sizes and height of the extended one, in points (Material's). */
export const FAB_SIZE: Record<FabSize, number> = {
  small: 40,
  regular: 56,
  large: 96,
  extended: 56,
};

/**
 * Corner radius of the `rounded` shape per size: Material 3's own tokens,
 * which grow with the button (`circle` is half the height instead).
 */
export const FAB_RADIUS: Record<FabSize, number> = {
  small: 12,
  regular: 16,
  large: 28,
  extended: 16,
};

/** Icon size per `FabSize`. */
export const FAB_ICON: Record<FabSize, number> = {
  small: 24,
  regular: 24,
  large: 36,
  extended: 24,
};

/** Horizontal padding of the extended capsule. */
export const FAB_EXTENDED_PADDING = 20;

/** Gap between the icon and the label of the extended one. */
export const FAB_GAP = 12;

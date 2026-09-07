import type {FabSize} from './types';

/** Diameter of the circular sizes and height of the extended one, in points (Material's). */
export const FAB_SIZE: Record<FabSize, number> = {
  small: 40,
  regular: 56,
  large: 96,
  extended: 56,
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

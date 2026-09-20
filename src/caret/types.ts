import type {MenuPoint} from '../menu/types';

/** A text field whose caret can be measured: the two the DOM has. */
export type CaretField = HTMLInputElement | HTMLTextAreaElement;

/**
 * Where the caret is, and how tall the line it sits on is — enough to open
 * something under it rather than over it.
 */
export interface CaretPoint extends MenuPoint {
  /** The height of the caret's line, in CSS pixels. */
  height: number;
}

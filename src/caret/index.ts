import type {CaretField, CaretPoint} from './types';

export type {CaretField, CaretPoint} from './types';

/**
 * Where the caret is — on web only, and this is the file that says so.
 *
 * `PopupMenu` has always documented "the caret in an editor" and "a menu
 * typed into (a slash command)" as what its `at` point is for, and nothing in
 * the kit could produce that point. On web the browser can be asked, in a
 * roundabout way (see `index.web.ts`). On the other three it cannot be asked
 * at all: React Native's `TextInput` reports selection as character offsets
 * and no rectangle, so a caret point would take a native module per platform —
 * `UITextInput.caretRect(for:)` on iOS, `Layout.getPrimaryHorizontal` with
 * `getLineTop` on Android, and `ITextRangeProvider::GetBoundingRectangles` on
 * Windows. That is three modules to place one menu, and the kit has one
 * native module in total.
 *
 * So this answers `null`, and a caller that gets `null` should anchor the menu
 * somewhere it can: the field itself, or a press point. A slash-command menu
 * that opens under the whole field is worse than one at the caret and far
 * better than one that does not open.
 */
export function caretPoint(_field: CaretField | null | undefined, _within?: Element | null): CaretPoint | null {
  return null;
}

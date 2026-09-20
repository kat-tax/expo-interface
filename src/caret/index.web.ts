import type {CaretField, CaretPoint} from './types';

export type {CaretField, CaretPoint} from './types';

/**
 * The declarations that decide where a glyph lands, copied onto the mirror so
 * it breaks its lines exactly where the field does.
 */
const LAYOUT = [
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontFamily',
  'lineHeight', 'letterSpacing', 'wordSpacing', 'textIndent', 'textTransform',
  'textAlign', 'tabSize', 'direction', 'wordBreak',
] as const;

/** What a line is worth when the field says `normal`. */
const NORMAL_LINE = 1.2;

/**
 * Where the caret is inside a text field, in CSS pixels.
 *
 * A text field has no API for this: the DOM will say which character the
 * caret is before and nothing about where that character was drawn. So the
 * field's text is laid out a second time, in a hidden `<div>` wearing the
 * field's own typography and width, with a `<span>` at the caret — and the
 * span reports where it landed. The technique is the one `bramus/rich-input`
 * falls back to, and `textarea-caret-position` before it; the browsers have
 * never offered anything better for a form control, because the text inside
 * one is not in the document (see §4.1 on the Custom Highlight API, which
 * cannot reach into a field for the same reason).
 *
 * `within` is the element the point should be measured from — the same box
 * `PopupMenu`'s `at` is in. Without it the point is the viewport's.
 *
 * Two things it is honest about. The mirror is laid out and thrown away on
 * every call, so call it when the caret moves rather than on every frame. And
 * it is exact only while the field's text is laid out the way the mirror is:
 * a field with its own `::first-line`, a ligature the mirror's font does not
 * form, or text shaped right-to-left inside left-to-right will drift.
 */
export function caretPoint(field: CaretField | null | undefined, within?: Element | null): CaretPoint | null {
  if (!field) return null;
  const view = field.ownerDocument.defaultView;
  if (!view) return null;
  const document = field.ownerDocument;
  const style = view.getComputedStyle(field);
  const single = field.tagName === 'INPUT';
  const mirror = document.createElement('div');
  for (const property of LAYOUT) mirror.style[property] = style[property];
  // The content box, scrollbar excluded, so the mirror wraps where the field
  // wraps — `width` from the computed style would include one.
  mirror.style.boxSizing = 'content-box';
  mirror.style.width = `${field.clientWidth - number(style.paddingLeft) - number(style.paddingRight)}px`;
  // A single-line field never wraps however long its value is; a textarea
  // wraps the way a textarea does.
  mirror.style.whiteSpace = single ? 'pre' : 'pre-wrap';
  mirror.style.overflowWrap = single ? 'normal' : 'break-word';
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '0';
  const caret = field.selectionStart ?? field.value.length;
  mirror.textContent = field.value.slice(0, caret);
  const marker = document.createElement('span');
  // The rest of the value, not one character: where a word wraps decides
  // which line the caret is drawn on, and only the layout engine knows that.
  // A dot stands in at the very end, so a span with no box still has one.
  marker.textContent = field.value.slice(caret) || '.';
  mirror.append(marker);
  document.body.append(mirror);
  // `offsetLeft` is measured from the mirror's padding edge, which is where
  // the field's text starts too — so what is left to add is the border the
  // mirror does not wear.
  const left = marker.offsetLeft + number(style.borderLeftWidth);
  const top = marker.offsetTop + number(style.borderTopWidth);
  mirror.remove();
  const box = field.getBoundingClientRect();
  const origin = within?.getBoundingClientRect();
  return {
    x: box.left + left - field.scrollLeft - (origin?.left ?? 0),
    y: box.top + top - field.scrollTop - (origin?.top ?? 0),
    height: number(style.lineHeight) || number(style.fontSize) * NORMAL_LINE,
  };
}

/** A computed length as a number; `normal` and `auto` come back as zero. */
function number(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

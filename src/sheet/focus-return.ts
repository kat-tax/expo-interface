/** An element the focus can be given to. `document.activeElement` is one: only HTML and SVG elements take the focus. */
type Focusable = Element & HTMLOrSVGElement;

/**
 * Web: where the keyboard focus goes once a sheet has closed, given what had
 * it as the sheet opened (the opener). The opener itself while it can take
 * the focus again: still in the page, drawn (an element `display: none`
 * hides has no client rects), and not inside a popover that has closed
 * since. A menu item that opened the sheet is hidden with its menu by the
 * time the sheet closes, so the focus goes to the control that invokes the
 * popover the item was in, the one whose `popovertarget` names it, which is
 * where the menu's own close sends the focus. With neither, nothing, and
 * the body keeps the focus.
 */
export function focusReturn(opener: Element | null): Focusable | null {
  if (opener === null) return null;
  // `closest` walks a detached tree too: an item whose menu has left the
  // page with it still names the popover it was in.
  const popover = opener.closest('[popover]');
  const closed = popover !== null && !popover.matches(':popover-open');
  if (opener.isConnected && !closed && opener.getClientRects().length > 0) return opener as Focusable;
  return popover === null ? null : invokerOf(popover);
}

/** The control in the page whose `popovertarget` names the popover, if any. */
function invokerOf(popover: Element): HTMLElement | null {
  const {id} = popover;
  if (id === '') return null;
  for (const control of document.querySelectorAll<HTMLElement>('[popovertarget]')) {
    if (control.getAttribute('popovertarget') === id) return control;
  }
  return null;
}

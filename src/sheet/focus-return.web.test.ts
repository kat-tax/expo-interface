import {focusReturn} from './focus-return';

/** Gives the element a box: jsdom lays nothing out, so no element has a client rect of its own. */
function drawn<T extends Element>(element: T): T {
  vi.spyOn(element as Element, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 40, 20)] as unknown as DOMRectList);
  return element;
}

/** A popover with an id, holding one item, and a control in the page that invokes it. */
function menu(id: string, inPage = true) {
  const trigger = document.body.appendChild(document.createElement('button'));
  trigger.setAttribute('popovertarget', id);
  const popover = document.createElement('div');
  popover.setAttribute('popover', 'auto');
  popover.id = id;
  const item = popover.appendChild(document.createElement('button'));
  if (inPage) document.body.appendChild(popover);
  return {trigger, popover, item};
}

describe('focusReturn (web)', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('goes nowhere when nothing had the focus', () => {
    expect(focusReturn(null)).toBeNull();
  });

  it('goes back to the opener while it is in the page and drawn', () => {
    const opener = drawn(document.body.appendChild(document.createElement('button')));
    expect(focusReturn(opener)).toBe(opener);
  });

  it('goes nowhere for an opener that has left the page', () => {
    const opener = drawn(document.createElement('button'));
    expect(focusReturn(opener)).toBeNull();
  });

  it('goes nowhere for an opener the page hides, which has no box', () => {
    const opener = document.body.appendChild(document.createElement('button'));
    opener.hidden = true;
    expect(focusReturn(opener)).toBeNull();
  });

  it('goes to the control that invokes the popover the opener was in once that popover has closed', () => {
    const {trigger, item} = menu('ui-menu-1');
    // The popover's state decides, not the item's box.
    expect(focusReturn(drawn(item))).toBe(trigger);
  });

  it('goes back to an opener inside a popover that is still open', () => {
    const {popover, item} = menu('ui-menu-1');
    vi.spyOn(popover, 'matches').mockImplementation(selector => selector === ':popover-open');
    expect(focusReturn(drawn(item))).toBe(item);
  });

  it('goes to the invoker when the opener has left the page with its menu', () => {
    const {trigger, item} = menu('ui-menu-1', false);
    expect(focusReturn(item)).toBe(trigger);
  });

  it('goes nowhere from a closed popover without an id, or one no control in the page invokes', () => {
    const {trigger, popover, item} = menu('ui-menu-1');
    trigger.remove();
    expect(focusReturn(item)).toBeNull();
    popover.removeAttribute('id');
    expect(focusReturn(item)).toBeNull();
  });

  it('matches the invoker on the whole attribute, not on a prefix', () => {
    const {trigger, item} = menu('ui-menu-1');
    const other = document.body.insertBefore(document.createElement('button'), trigger);
    other.setAttribute('popovertarget', 'ui-menu-10');
    expect(focusReturn(item)).toBe(trigger);
  });
});

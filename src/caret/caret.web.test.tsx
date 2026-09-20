import {caretPoint} from '.';

/** jsdom lays nothing out, so a field is given the box it would have had. */
function box(element: Element, rect: Partial<DOMRect>) {
  element.getBoundingClientRect = () => ({x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}), ...rect}) as DOMRect;
}

function field(tag: 'input' | 'textarea', value: string, caret: number, css = 'font: 16px/24px monospace;') {
  const element = document.createElement(tag);
  element.style.cssText = `${css} padding: 4px 6px; border: 2px solid;`;
  document.body.append(element);
  element.value = value;
  element.setSelectionRange(caret, caret);
  box(element, {left: 100, top: 50});
  return element;
}

/** The hidden div the measurement lays out in, caught on its way into the page. */
function mirrorOf(run: () => unknown): HTMLElement {
  let mirror: HTMLElement | undefined;
  const append = document.body.append.bind(document.body);
  const spy = vi.spyOn(document.body, 'append').mockImplementation((...nodes: (Node | string)[]) => {
    mirror = nodes[0] as HTMLElement;
    append(...nodes);
  });
  run();
  spy.mockRestore();
  return mirror!;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('caretPoint (web)', () => {
  it('answers nothing when there is no field, or no window to ask', () => {
    expect(caretPoint(null)).toBeNull();
    expect(caretPoint(undefined)).toBeNull();
    // A document nobody is showing has no view, and so no computed styles.
    const detached = document.implementation.createHTMLDocument();
    expect(detached.defaultView).toBeNull();
    expect(caretPoint(detached.createElement('textarea'))).toBeNull();
  });

  it('measures from the field\'s own box, past its border', () => {
    const element = field('textarea', 'hello world', 5);
    const point = caretPoint(element);
    // jsdom puts every glyph at the origin, so what is left to see is the
    // field's position and the border the mirror does not wear.
    expect(point).toEqual({x: 100 + 2, y: 50 + 2, height: 24});
  });

  it('takes the point back to the box the menu is laid over', () => {
    const element = field('textarea', 'hello', 5);
    const canvas = document.createElement('div');
    box(canvas, {left: 40, top: 20});
    expect(caretPoint(element, canvas)).toMatchObject({x: 62, y: 32});
  });

  it('follows the field when it has been scrolled', () => {
    const element = field('textarea', 'hello', 5);
    element.scrollLeft = 30;
    element.scrollTop = 12;
    expect(caretPoint(element)).toMatchObject({x: 72, y: 40});
  });

  it('lays the text out again the way the field does, up to the caret', () => {
    const element = field('textarea', 'one two three', 7);
    const mirror = mirrorOf(() => caretPoint(element));
    expect(mirror.firstChild?.textContent).toBe('one two');
    expect(mirror.lastChild?.textContent).toBe(' three');
    expect(mirror.style.whiteSpace).toBe('pre-wrap');
    expect(mirror.style.overflowWrap).toBe('break-word');
    expect(mirror.style.fontFamily).toBe('monospace');
    expect(mirror.style.paddingLeft).toBe('6px');
    expect(mirror.style.visibility).toBe('hidden');
    // And it is gone again: the page is left as it was found.
    expect(document.querySelectorAll('div')).toHaveLength(0);
  });

  it('never wraps a single-line field, however long its value', () => {
    const mirror = mirrorOf(() => caretPoint(field('input', 'a very long single line of text', 31)));
    expect(mirror.style.whiteSpace).toBe('pre');
    expect(mirror.style.overflowWrap).toBe('normal');
  });

  it('gives the span a box of its own when the caret is at the very end', () => {
    const mirror = mirrorOf(() => caretPoint(field('textarea', 'end', 3)));
    // Nothing follows the caret, and a span with nothing in it has no
    // position to report.
    expect(mirror.lastChild?.textContent).toBe('.');
  });

  it('measures from the end when the field reports no selection', () => {
    const element = field('textarea', 'abcdef', 0);
    Object.defineProperty(element, 'selectionStart', {value: null});
    const mirror = mirrorOf(() => caretPoint(element));
    expect(mirror.firstChild?.textContent).toBe('abcdef');
  });

  it('works out a line for a field that never says how tall one is', () => {
    const element = field('textarea', 'hi', 2, 'font-family: monospace; font-size: 16px;');
    // `normal` is not a length, so the line is the font size and a bit.
    expect(caretPoint(element)?.height).toBeCloseTo(16 * 1.2);
  });
});

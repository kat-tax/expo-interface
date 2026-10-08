/**
 * A `ResizeObserver` for jsdom, which has none: it keeps the elements it
 * observes, and reports the sizes a test hands `reportSizes`, each observer
 * getting the entries of the elements it observes, as the browser does.
 * Install it with `vi.stubGlobal('ResizeObserver', TestResizeObserver)` and
 * empty `TestResizeObserver.all` before each test.
 */
export class TestResizeObserver {
  static all: TestResizeObserver[] = [];
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(readonly callback: ResizeObserverCallback) {
    TestResizeObserver.all.push(this);
  }

  observe(element: Element) {
    this.observed.add(element);
  }

  unobserve(element: Element) {
    this.observed.delete(element);
  }

  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }
}

/** An element's size, in CSS pixels: its border box's height, and its content box's width. */
export interface ReportedSize {
  target: Element;
  height?: number;
  width?: number;
}

/** Reports sizes to every live observer that observes their elements. Wrap it in `act`. */
export function reportSizes(sizes: readonly ReportedSize[]): void {
  for (const observer of TestResizeObserver.all) {
    const entries = sizes.filter(size => observer.observed.has(size.target)).map(size => ({
      target: size.target,
      contentRect: {width: size.width ?? 0, height: size.height ?? 0},
      borderBoxSize: [{blockSize: size.height ?? 0, inlineSize: size.width ?? 0}],
    }));
    if (entries.length > 0) observer.callback(entries as unknown as ResizeObserverEntry[], observer as unknown as ResizeObserver);
  }
}

/** A `DOMRect` at `top`, `height` tall, as `getBoundingClientRect` answers. */
export function rectAt(top: number, height: number): DOMRect {
  return {top, bottom: top + height, height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({})} as DOMRect;
}

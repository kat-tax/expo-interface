import {act, fireEvent, render, screen} from '@testing-library/react';
import {TestResizeObserver, rectAt, reportSizes} from '../__tests__/resize';
import {List} from '.';

const ROWS = Array.from({length: 300}, (_, index) => `Row ${index}`);

/** How far the list has scrolled, how tall it is and where its top is in the window: what the page's layout answers. */
let scrolled = 0;
let boxHeight = 600;
let boxTop = 0;
/** The boxes around the list a test lays out, and where each is in the window. */
const around = new Map<Element, DOMRect>();

const items = () => screen.getAllByRole('listitem');
const spacers = () => [...screen.getByTestId('list').querySelectorAll<HTMLElement>('.ui-list__spacer')];
const scrollTo = (offset: number) => {
  scrolled = offset;
  fireEvent.scroll(screen.getByTestId('list'));
};
/** The observer's report of the list's own box, as the browser sends once the list is laid out. */
const laidOut = () => act(() => reportSizes([{target: screen.getByTestId('list'), height: boxHeight}]));

function list(props: Partial<React.ComponentProps<typeof List<string>>> = {}) {
  return <List data={ROWS} renderItem={title => <p>{title}</p>} keyExtractor={title => title} testID="list" {...props}/>;
}

function renderList(props: Partial<React.ComponentProps<typeof List<string>>> = {}) {
  return render(list(props));
}

describe('List (web), windowed', () => {
  beforeEach(() => {
    scrolled = 0;
    boxHeight = 600;
    boxTop = 0;
    around.clear();
    TestResizeObserver.all = [];
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    // A list 600 px tall at the top of the window; the spacer before the rows moves up as it scrolls.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('ui-list')) return rectAt(boxTop, boxHeight);
      if (this.classList.contains('ui-list__spacer')) return rectAt(boxTop - scrolled, 0);
      return around.get(this) ?? rectAt(0, 0);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('draws the rows near the view, and keeps the room of the rest at the estimate', () => {
    renderList();
    // The observer's first report: the view and a viewport below it, 1200 px of 56 px rows.
    act(() => reportSizes([{target: screen.getByTestId('list'), height: 600}]));
    expect(items()).toHaveLength(22);
    expect(items()[0]).toHaveAttribute('aria-posinset', '1');
    expect(items()[0]).toHaveAttribute('aria-setsize', '300');
    expect(spacers().map(spacer => spacer.style.height)).toEqual(['0px', `${278 * 56}px`]);
    // A hundred rows down: a viewport above the view and one below it.
    scrollTo(5600);
    expect(items()[0]).toHaveTextContent('Row 89');
    expect(items()[0]).toHaveAttribute('aria-posinset', '90');
    expect(items().at(-1)).toHaveTextContent('Row 121');
    expect(spacers().map(spacer => spacer.style.height)).toEqual([`${89 * 56}px`, `${(300 - 122) * 56}px`]);
  });

  it('removes a focused row scrolled more than a viewport out of view, and the focus with it', () => {
    renderList({renderItem: title => <button type="button">{title}</button>});
    laidOut();
    const first = screen.getByRole('button', {name: 'Row 0'});
    act(() => first.focus());
    expect(document.activeElement).toBe(first);
    // Row 0 ends 56 px down: a viewport above the view still draws it.
    scrollTo(600);
    expect(document.activeElement).toBe(first);
    scrollTo(700);
    expect(screen.queryByRole('button', {name: 'Row 0'})).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('keeps the room of a row at its measured height once drawn', () => {
    renderList();
    scrollTo(5600);
    const drawn = items();
    // Every row drawn is 80 px tall, not the 56 estimated: fewer of them fill the view.
    act(() => reportSizes(drawn.map(target => ({target, height: 80}))));
    expect(items()[0]).toHaveTextContent('Row 89');
    expect(items().at(-1)).toHaveTextContent('Row 111');
    // The rows measured after the window are 80 px of room each, the rest 56.
    expect(spacers()[1]!.style.height).toBe(`${10 * 80 + (300 - 122) * 56}px`);
    // The same sizes again change nothing.
    act(() => reportSizes(drawn.slice(0, 1).map(target => ({target, height: 80}))));
    expect(items().at(-1)).toHaveTextContent('Row 111');
  });

  it('observes the rows it draws, and lets go of the ones it stops drawing', () => {
    renderList();
    const [observer] = TestResizeObserver.all;
    const firstRow = items()[0]!;
    // The rows drawn before the observer existed, and the list itself.
    expect(observer!.observed.has(firstRow)).toBe(true);
    expect(observer!.observed.has(screen.getByTestId('list'))).toBe(true);
    scrollTo(5600);
    expect(firstRow.isConnected).toBe(false);
    expect(observer!.observed.has(firstRow)).toBe(false);
    expect(observer!.observed.has(items()[0]!)).toBe(true);
  });

  it('draws the first rows of a list that is hidden', () => {
    renderList();
    scrollTo(5600);
    expect(items()[0]).toHaveTextContent('Row 89');
    boxHeight = 0;
    scrollTo(5600);
    expect(items()[0]).toHaveTextContent('Row 0');
    expect(items()).toHaveLength(22);
  });

  it('follows a resize of the window', () => {
    renderList();
    scrolled = 5600;
    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
    });
    expect(items()[0]).toHaveTextContent('Row 89');
  });

  it('draws the first rows of a list wholly outside the window, as of a hidden one, and reaches no end there', () => {
    const onEndReached = vi.fn();
    renderList({onEndReached});
    // Below the window, where a sheet's drawer holds the list before it
    // slides in: clipped by the window, the box would hold one row.
    boxTop = 800;
    laidOut();
    expect(items()).toHaveLength(22);
    expect(items()[0]).toHaveTextContent('Row 0');
    // Above it.
    boxTop = -700;
    laidOut();
    expect(items()).toHaveLength(22);
    expect(onEndReached).not.toHaveBeenCalled();
  });

  it('reads the page again when a transition ends anywhere in it, so a list that slides in with a sheet draws its rows once it has arrived', () => {
    boxTop = 800;
    render(<div data-testid="drawer">{list()}</div>);
    laidOut();
    expect(items()).toHaveLength(22);
    // The drawer's transform transition ends with the list's top 300 px above
    // the window's bottom edge: those 300 px, and a viewport of them more.
    boxTop = 468;
    fireEvent.transitionEnd(screen.getByTestId('drawer'));
    expect(items()).toHaveLength(11);
    expect(items()[0]).toHaveTextContent('Row 0');
  });

  it('reads the page again when an animation ends anywhere in it', () => {
    render(<div data-testid="drawer">{list()}</div>);
    scrolled = 5600;
    fireEvent.animationEnd(screen.getByTestId('drawer'));
    expect(items()[0]).toHaveTextContent('Row 89');
  });

  describe('in a box that scrolls', () => {
    /** A list in a box with its own `overflow-y`, such as a capped sheet body, which is 320 px tall 100 px down the window. */
    function inBody(overflowY: React.CSSProperties['overflowY'], props: Partial<React.ComponentProps<typeof List<string>>> = {}) {
      const result = render(<div data-testid="body" style={{overflowY}}>{list(props)}</div>);
      around.set(screen.getByTestId('body'), rectAt(100, 320));
      return result;
    }

    beforeEach(() => {
      // The list is as tall as its rows and does not scroll: the body does, and moves it.
      boxTop = 100;
      boxHeight = 2000;
    });

    it('draws what the box shows and as much again on each side, not what the window shows', () => {
      inBody('auto');
      laidOut();
      // 320 px of the list show, and 320 more below them: the rows that start above 640 px.
      expect(items()).toHaveLength(12);
      expect(items().at(-1)).toHaveTextContent('Row 11');
      // The body scrolled 1000 px: 320 px above the 320 that show, and 320 below.
      boxTop = -900;
      fireEvent.scroll(screen.getByTestId('body'));
      expect(items()[0]).toHaveTextContent('Row 12');
      expect(items().at(-1)).toHaveTextContent('Row 29');
    });

    it('reaches no end as the box opens on a page of rows, and reaches it once the rows drawn for what it shows include the last', () => {
      const onEndReached = vi.fn();
      // A page of twenty 44 px rows: 880 px of list behind a body of 320.
      boxHeight = 880;
      inBody('auto', {data: ROWS.slice(0, 20), estimatedItemHeight: 44, onEndReached});
      laidOut();
      expect(items()).toHaveLength(15);
      expect(onEndReached).not.toHaveBeenCalled();
      // The body scrolled to the end of the list.
      boxTop = 100 - (880 - 320);
      fireEvent.scroll(screen.getByTestId('body'));
      expect(items().at(-1)).toHaveTextContent('Row 19');
      expect(onEndReached).toHaveBeenCalledTimes(1);
    });

    it('takes every value of overflow-y but visible as clipping', () => {
      for (const overflowY of ['scroll', 'hidden', 'clip'] as const) {
        const {unmount} = inBody(overflowY);
        laidOut();
        expect(items()).toHaveLength(12);
        unmount();
      }
    });

    it('draws a single row while the box shows none of the list, until a scroll brings it in', () => {
      inBody('auto');
      // The list starts below what the body shows: a heading above it fills the body.
      boxTop = 500;
      laidOut();
      expect(items()).toHaveLength(1);
      expect(items()[0]).toHaveTextContent('Row 0');
      boxTop = 100;
      fireEvent.scroll(screen.getByTestId('body'));
      expect(items()).toHaveLength(12);
    });

    it('is clipped by nothing around it whose overflow-y is visible, only by the window', () => {
      inBody('visible');
      laidOut();
      // 668 px show in the window, from 100 px down, and 668 more below them.
      expect(items()).toHaveLength(24);
    });

    it('is clipped by a fixed box around it, which the window places, and by nothing around that', () => {
      render(
        <div data-testid="page" style={{overflowY: 'auto'}}>
          <div data-testid="drawer" style={{position: 'fixed', overflowY: 'auto'}}>{list()}</div>
        </div>,
      );
      // The page's scroll view the drawer sits in shows none of where the drawer is.
      around.set(screen.getByTestId('page'), rectAt(0, 100));
      around.set(screen.getByTestId('drawer'), rectAt(100, 320));
      laidOut();
      expect(items()).toHaveLength(12);
    });
  });

  it('takes no clip from the body, whose overflow is the window\'s', () => {
    document.body.style.overflowY = 'hidden';
    // The body's own box, scrolled away with the page.
    around.set(document.body, rectAt(-4000, 768));
    try {
      renderList();
      laidOut();
      expect(items()).toHaveLength(22);
    } finally {
      document.body.style.overflowY = '';
    }
  });

  it('windows by the scroll and the estimate alone where there is no ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    renderList({estimatedItemHeight: 100});
    expect(items()).toHaveLength(12);
    scrollTo(5000);
    expect(items()[0]).toHaveTextContent('Row 44');
  });

  it('takes its end from the first rows where there is no ResizeObserver, since nothing reads the page before a scroll', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const onEndReached = vi.fn();
    renderList({data: ROWS.slice(0, 3), onEndReached});
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('reaches no end before it is laid out, or while it is hidden', () => {
    const onEndReached = vi.fn();
    renderList({data: ROWS.slice(0, 3), onEndReached});
    // Three rows are inside the first 1200 px, but the page has not been read.
    expect(items()).toHaveLength(3);
    expect(onEndReached).not.toHaveBeenCalled();
    boxHeight = 0;
    laidOut();
    expect(onEndReached).not.toHaveBeenCalled();
    boxHeight = 600;
    laidOut();
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('reaches the end once the window draws the last row, and once only', () => {
    const onEndReached = vi.fn();
    renderList({onEndReached});
    expect(onEndReached).not.toHaveBeenCalled();
    scrollTo(300 * 56 - 600);
    expect(items().at(-1)).toHaveTextContent('Row 299');
    expect(onEndReached).toHaveBeenCalledTimes(1);
    scrollTo(300 * 56 - 700);
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('reaches the end again when more rows arrive while it is still drawn, until the view is full', () => {
    const onEndReached = vi.fn();
    const {rerender} = renderList({data: ROWS.slice(0, 3), onEndReached});
    laidOut();
    expect(onEndReached).toHaveBeenCalledTimes(1);
    rerender(list({data: ROWS.slice(0, 6), onEndReached}));
    expect(onEndReached).toHaveBeenCalledTimes(2);
    // Past what the window draws: the end is no longer drawn.
    rerender(list({onEndReached}));
    expect(onEndReached).toHaveBeenCalledTimes(2);
  });

  it('reaches no end without a handler, or with no rows', () => {
    renderList({data: ROWS.slice(0, 3)});
    laidOut();
    expect(items()).toHaveLength(3);
    const onEndReached = vi.fn();
    render(<List data={[]} renderItem={() => null} onEndReached={onEndReached}/>);
    expect(onEndReached).not.toHaveBeenCalled();
  });

  it('stops listening when it goes', () => {
    const removeFromDocument = vi.spyOn(document, 'removeEventListener');
    const removeFromWindow = vi.spyOn(globalThis, 'removeEventListener');
    const {unmount} = renderList();
    const [observer] = TestResizeObserver.all;
    unmount();
    expect(removeFromDocument).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(removeFromDocument).toHaveBeenCalledWith('transitionend', expect.any(Function), true);
    expect(removeFromDocument).toHaveBeenCalledWith('animationend', expect.any(Function), true);
    expect(removeFromWindow).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(observer!.disconnected).toBe(true);
  });
});

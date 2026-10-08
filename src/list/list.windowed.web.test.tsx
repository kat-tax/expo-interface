import {act, fireEvent, render, screen} from '@testing-library/react';
import {TestResizeObserver, rectAt, reportSizes} from '../__tests__/resize';
import {List} from '.';

const ROWS = Array.from({length: 300}, (_, index) => `Row ${index}`);

/** How far the list has scrolled, and how tall it is: what the page's layout answers. */
let scrolled = 0;
let boxHeight = 600;

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
    TestResizeObserver.all = [];
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    // A list 600 px tall at the top of the window; the spacer before the rows moves up as it scrolls.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('ui-list')) return rectAt(0, boxHeight);
      if (this.classList.contains('ui-list__spacer')) return rectAt(-scrolled, 0);
      return rectAt(0, 0);
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
    expect(removeFromWindow).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(observer!.disconnected).toBe(true);
  });
});

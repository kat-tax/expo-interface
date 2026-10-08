import {act, fireEvent, render, screen} from '@testing-library/react';
import {TestResizeObserver, rectAt, reportSizes} from '../__tests__/resize';
import {CardGrid} from '.';

const CARDS = Array.from({length: 200}, (_, index) => `Card ${index}`);

/** How far the grid has scrolled: what the page's layout answers. */
let scrolled = 0;

const cells = () => screen.getAllByRole('listitem');
const spacers = () => [...screen.getByTestId('grid').querySelectorAll<HTMLElement>('.ui-card-grid__spacer')];
const width = (value: number) => act(() => reportSizes([{target: screen.getByTestId('grid'), width: value, height: 600}]));
const scrollTo = (offset: number) => {
  scrolled = offset;
  fireEvent.scroll(screen.getByTestId('grid'));
};

function renderGrid(props: Partial<React.ComponentProps<typeof CardGrid<string>>> = {}) {
  return render(
    <CardGrid data={CARDS} renderItem={title => <p>{title}</p>} keyExtractor={title => title} minItemWidth={150} maxColumns={4} gap={12} testID="grid" {...props}/>,
  );
}

describe('CardGrid (web), windowed', () => {
  beforeEach(() => {
    scrolled = 0;
    TestResizeObserver.all = [];
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    // A grid 600 px tall at the top of the window; the spacer before the cells moves up as it scrolls.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('ui-card-grid')) return rectAt(0, 600);
      if (this.classList.contains('ui-card-grid__spacer')) return rectAt(-scrolled, 0);
      return rectAt(0, 0);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('counts the columns from the width it measures, the way the native grid does', () => {
    renderGrid();
    // Four cells of 150 and three gaps of 12 are 636.
    width(636);
    expect(screen.getByRole('list').style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    // Two at a phone's width: two cells to a row, so seven rows are fourteen cells.
    width(390);
    expect(screen.getByRole('list').style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(cells()).toHaveLength(14);
    expect(spacers()[1]!.style.height).toBe(`${(100 - 7) * 192}px`);
    // Hidden: back to the stylesheet's own count.
    width(0);
    expect(screen.getByRole('list').style.gridTemplateColumns).toBe('');
  });

  it('draws whole rows of cells near the view, and keeps the room of the rest at the estimate', () => {
    renderGrid();
    width(636);
    // 1200 px of 180 px rows with a gap of 12: seven rows of four.
    expect(cells()).toHaveLength(28);
    expect(spacers().map(spacer => spacer.style.height)).toEqual(['0px', `${(50 - 7) * 192}px`]);
    // Ten rows down: a viewport above the view and one below it.
    scrollTo(1920);
    expect(cells()).toHaveLength((17 - 6) * 4);
    expect(cells()[0]).toHaveTextContent('Card 24');
    expect(cells()[0]).toHaveAttribute('aria-posinset', '25');
    expect(cells()[0]).toHaveAttribute('aria-setsize', '200');
    expect(spacers().map(spacer => spacer.style.height)).toEqual([`${6 * 192}px`, `${(50 - 17) * 192}px`]);
  });

  it('measures a row by its first cell, and keeps its room at that height', () => {
    renderGrid();
    width(636);
    // Only the first cell of a row carries the row's key: the cells stretch to their row.
    expect(cells()[0]!.dataset.windowKey).toBe('4:Card 0');
    expect(cells()[1]!.dataset.windowKey).toBeUndefined();
    expect(cells()[4]!.dataset.windowKey).toBe('4:Card 4');
    // The last drawn row is 400 px tall, not 180: its room counts it once it is past the window.
    const lastRow = cells()[24]!;
    act(() => reportSizes([{target: lastRow, height: 400}]));
    scrollTo(1920);
    expect(spacers()[0]!.style.height).toBe(`${6 * 192}px`);
    scrollTo(4000);
    // Rows 0 to 5 at 192 px with their gaps, row 6 at 412, and the rest at 192 up to the first drawn.
    const first = Number(cells()[0]!.getAttribute('aria-posinset')) - 1;
    expect(spacers()[0]!.style.height).toBe(`${(first / 4 - 1) * 192 + 412}px`);
  });

  it('reaches the end once the window draws the last row, and once only', () => {
    const onEndReached = vi.fn();
    renderGrid({onEndReached});
    width(636);
    expect(onEndReached).not.toHaveBeenCalled();
    // Fifty rows of 180 with 49 gaps of 12.
    scrollTo(50 * 192 - 12 - 600);
    expect(cells().at(-1)).toHaveTextContent('Card 199');
    expect(onEndReached).toHaveBeenCalledTimes(1);
    scrollTo(50 * 192 - 12 - 700);
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('reaches no end without a handler, or with no cards', () => {
    renderGrid({data: CARDS.slice(0, 3)});
    expect(cells()).toHaveLength(3);
    const onEndReached = vi.fn();
    render(<CardGrid data={[]} renderItem={() => null} onEndReached={onEndReached}/>);
    expect(onEndReached).not.toHaveBeenCalled();
  });

  it('stops measuring when it goes', () => {
    const {unmount} = renderGrid();
    const observers = [...TestResizeObserver.all];
    expect(observers).toHaveLength(2);
    unmount();
    expect(observers.every(observer => observer.disconnected)).toBe(true);
  });
});

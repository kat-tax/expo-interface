import {render, screen} from '@testing-library/react';
import {ScrollInsetsContext} from '../screen/insets';
import {CardGrid} from '.';

const items = ['A', 'B', 'C'];

let observe: ((entries: {isIntersecting: boolean}[]) => void) | null = null;
const disconnect = vi.fn();

describe('CardGrid (web)', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: {isIntersecting: boolean}[]) => void) {
        observe = callback;
      }
      observe() {}
      disconnect = disconnect;
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('is a CSS grid of cells, each laid out as it comes into view, sized from the props', () => {
    render(<CardGrid data={items} renderItem={item => <p>{item}</p>} keyExtractor={item => item} minItemWidth={160} maxColumns={3} gap={16} estimatedItemHeight={200} testID="grid"/>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--ui-card-grid-min')).toBe('160px');
    expect(grid.style.getPropertyValue('--ui-card-grid-gap')).toBe('16px');
    expect(grid.style.getPropertyValue('--ui-card-grid-cell')).toBe('200px');
    // Never more than three: a cell is at least a third of the row less the gaps.
    expect(grid.style.getPropertyValue('--ui-card-grid-share')).toBe('calc((100% - 2 * 16px) / 3)');
    const cells = screen.getAllByRole('listitem');
    expect(cells.map(cell => cell.textContent)).toEqual(items);
    expect(cells[0]).toHaveClass('ui-card-grid__cell');
    expect(screen.getByRole('list')).toHaveClass('ui-card-grid__cells');
  });

  it('takes the defaults: four columns of 150 with a gap of 12', () => {
    render(<CardGrid data={items} renderItem={item => <p>{item}</p>} testID="grid"/>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--ui-card-grid-min')).toBe('150px');
    expect(grid.style.getPropertyValue('--ui-card-grid-share')).toBe('calc((100% - 3 * 12px) / 4)');
  });

  it('puts the header before the cells and the footer after, and the empty state in place of none', () => {
    const {unmount} = render(<CardGrid data={[]} renderItem={() => null} header={<p>Header</p>} footer={<p>Footer</p>} empty={<p>Nothing yet</p>} testID="grid"/>);
    expect(screen.getByTestId('grid').textContent).toBe('HeaderNothing yetFooter');
    expect(screen.queryByRole('list')).toBeNull();
    unmount();
    render(<CardGrid data={['One']} renderItem={item => <p>{item}</p>} header={<p>Header</p>} empty={<p>Nothing yet</p>} testID="grid"/>);
    expect(screen.getByTestId('grid').textContent).toBe('HeaderOne');
  });

  it('reports the end once the last cell is in view, and watches nothing without a handler', () => {
    const onEndReached = vi.fn();
    const {unmount} = render(<CardGrid data={items} renderItem={item => <p>{item}</p>} onEndReached={onEndReached}/>);
    observe!([{isIntersecting: false}]);
    observe!([{isIntersecting: true}]);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    unmount();
    expect(disconnect).toHaveBeenCalled();
    observe = null;
    render(<CardGrid data={items} renderItem={item => <p>{item}</p>}/>);
    expect(observe).toBeNull();
  });

  it('pads its content by the screen\'s bar and its own insets', () => {
    render(
      <ScrollInsetsContext.Provider value={{top: 80, bottom: 0, automatic: false}}>
        <CardGrid data={items} renderItem={item => <p>{item}</p>} contentInset={{top: 8, bottom: 20}} style={{marginTop: 4}} testID="grid"/>
      </ScrollInsetsContext.Provider>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.style.paddingTop).toBe('88px');
    expect(grid.style.paddingBottom).toBe('20px');
    expect(grid.style.marginTop).toBe('4px');
  });
});

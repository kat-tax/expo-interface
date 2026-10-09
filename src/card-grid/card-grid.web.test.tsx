import {render, screen} from '@testing-library/react';
import {ScrollInsetsContext} from '../screen/insets';
import {CardGrid} from '.';

const items = ['A', 'B', 'C'];

describe('CardGrid (web)', () => {
  it('is a CSS grid of cells, sized from the props, each saying where it stands', () => {
    render(<CardGrid data={items} renderItem={item => <p>{item}</p>} keyExtractor={item => item} minItemWidth={160} maxColumns={3} gap={16} testID="grid"/>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--ui-card-grid-min')).toBe('160px');
    expect(grid.style.getPropertyValue('--ui-card-grid-gap')).toBe('16px');
    // Never more than three: a cell is at least a third of the row less the gaps.
    expect(grid.style.getPropertyValue('--ui-card-grid-share')).toBe('calc((100% - 2 * 16px) / 3)');
    const cells = screen.getAllByRole('listitem');
    expect(cells.map(cell => cell.textContent)).toEqual(items);
    expect(cells.map(cell => cell.getAttribute('aria-posinset'))).toEqual(['1', '2', '3']);
    expect(cells.every(cell => cell.getAttribute('aria-setsize') === '3')).toBe(true);
    expect(cells[0]).toHaveClass('ui-card-grid__cell');
    const list = screen.getByRole('list');
    expect(list).toHaveClass('ui-card-grid__cells');
    // Until the width is measured the stylesheet counts the columns.
    expect(list.style.gridTemplateColumns).toBe('');
    // The spacers and the cells, in a column of their own inside the scroller.
    expect(list.parentElement).toHaveClass('ui-card-grid__window');
    expect(list.parentElement!.parentElement).toBe(grid);
    expect(list.previousElementSibling).toHaveClass('ui-card-grid__spacer');
    expect(list.nextElementSibling).toHaveClass('ui-card-grid__spacer');
  });

  it('takes the defaults: four columns of 150 with a gap of 12', () => {
    render(<CardGrid data={items} renderItem={item => <p>{item}</p>} testID="grid"/>);
    const grid = screen.getByTestId('grid');
    expect(grid.style.getPropertyValue('--ui-card-grid-min')).toBe('150px');
    expect(grid.style.getPropertyValue('--ui-card-grid-share')).toBe('calc((100% - 3 * 12px) / 4)');
  });

  it('takes a cap of whole columns, and at least one, before the width is measured too', () => {
    // A cap worked out from a narrow width: one cell to a row, each the first of its own.
    const {unmount} = render(<CardGrid data={items} renderItem={item => <p>{item}</p>} keyExtractor={item => item} maxColumns={0} testID="grid"/>);
    expect(screen.getByTestId('grid').style.getPropertyValue('--ui-card-grid-share')).toBe('calc((100% - 0 * 12px) / 1)');
    expect(screen.getAllByRole('listitem').map(cell => cell.dataset.windowKey)).toEqual(['1:A', '1:B', '1:C']);
    unmount();
    // A fraction counts down: two to a row.
    render(<CardGrid data={items} renderItem={item => <p>{item}</p>} keyExtractor={item => item} maxColumns={2.5} testID="grid"/>);
    expect(screen.getByTestId('grid').style.getPropertyValue('--ui-card-grid-share')).toBe('calc((100% - 1 * 12px) / 2)');
    expect(screen.getAllByRole('listitem').map(cell => cell.dataset.windowKey)).toEqual(['2:A', undefined, '2:C']);
  });

  it('puts the header before the cells and the footer after, and the empty state in place of none', () => {
    const {unmount} = render(<CardGrid data={[]} renderItem={() => null} header={<p>Header</p>} footer={<p>Footer</p>} empty={<p>Nothing yet</p>} testID="grid"/>);
    expect(screen.getByTestId('grid').textContent).toBe('HeaderNothing yetFooter');
    expect(screen.queryByRole('list')).toBeNull();
    unmount();
    render(<CardGrid data={['One']} renderItem={item => <p>{item}</p>} header={<p>Header</p>} empty={<p>Nothing yet</p>} testID="grid"/>);
    expect(screen.getByTestId('grid').textContent).toBe('HeaderOne');
  });

  it('pads its content by the screen\'s bar and its own insets, inside the scroller', () => {
    render(
      <ScrollInsetsContext.Provider value={{top: 80, bottom: 0, left: 0, right: 0, automatic: false}}>
        <CardGrid data={items} renderItem={item => <p>{item}</p>} contentInset={{top: 8, bottom: 20, left: 16, right: 4}} style={{marginTop: 4}} testID="grid"/>
      </ScrollInsetsContext.Provider>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.style.paddingTop).toBe('88px');
    expect(grid.style.paddingBottom).toBe('20px');
    // The sides are the grid's own, inside the scroller too.
    expect(grid.style.paddingLeft).toBe('16px');
    expect(grid.style.paddingRight).toBe('4px');
    // A card the keyboard focus scrolls into view stops clear of the bar.
    expect(grid.style.scrollPaddingTop).toBe('88px');
    expect(grid.style.scrollPaddingBottom).toBe('20px');
    expect(grid.style.marginTop).toBe('4px');
  });

  it('scrolls itself, filling the space its parent gives it, and leaves the cells to the window', async () => {
    const {readFileSync} = await import('node:fs');
    const {join} = await import('node:path');
    const css = readFileSync(join(__dirname, 'card-grid.css'), 'utf8');
    const root = /\.ui-card-grid \{([^}]*)\}/.exec(css)![1];
    expect(root).toContain('overflow-y: auto;');
    // A basis of auto: in a parent with no height of its own the grid grows to its cells.
    expect(root).toContain('flex: 1 1 auto;');
    expect(root).toContain('min-height: 0;');
    // Padding in `style` stays inside the full width.
    expect(root).toContain('box-sizing: border-box;');
    // A flex column, so an empty state that grows fills it under the header.
    expect(root).toContain('display: flex;');
    expect(root).toContain('flex-direction: column;');
    expect(/\.ui-card-grid__cells \{([^}]*)\}/.exec(css)![1]).toContain('flex: none;');
    // The window has no gap of its own: the spacers carry the gaps of the rows they stand for.
    expect(/\.ui-card-grid__window \{([^}]*)\}/.exec(css)![1]).not.toContain('gap');
    // Never a scroll anchor, so the drawn cells hold still while a spacer changes.
    expect(/\.ui-card-grid__spacer \{([^}]*)\}/.exec(css)![1]).toContain('overflow-anchor: none;');
    // A cell skipped by the browser would report the estimate as its height.
    expect(css).not.toContain('content-visibility');
  });

  it('grows to its cells in a parent with a height when its style stops it shrinking', () => {
    render(<CardGrid data={items} renderItem={item => <p>{item}</p>} style={{flexShrink: 0}} testID="grid"/>);
    // Over the stylesheet's `flex: 1 1 auto`: the parent scrolls the grid.
    expect(screen.getByTestId('grid').style.flexShrink).toBe('0');
  });
});

import {render, screen} from '@testing-library/react';
import {ListItem} from '../list-item';
import {ScrollInsetsContext} from '../screen/insets';
import {List} from '.';

const rows = ['Essay', 'Notes', 'Sketch'];

describe('List (web)', () => {
  it('is a DOM list of the rows, each saying where it stands, with hairlines between them', () => {
    render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} keyExtractor={title => title} testID="list"/>);
    const list = screen.getByRole('list');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items.map(item => item.textContent)).toEqual(rows);
    expect(items.map(item => item.getAttribute('aria-posinset'))).toEqual(['1', '2', '3']);
    expect(items.every(item => item.getAttribute('aria-setsize') === '3')).toBe(true);
    expect(items[0]!.dataset.windowKey).toBe('Essay');
    // The hairline is above every row but the first.
    expect(items[0]).toHaveClass('ui-list__row');
    expect(items[0]).not.toHaveClass('ui-list__row--ruled');
    expect(items[1]).toHaveClass('ui-list__row', 'ui-list__row--ruled');
    expect(screen.getByTestId('list')).toHaveClass('ui-list--separated');
    // The list owns only its rows: the spacers are beside it, in the scroller.
    expect(list.parentElement).toBe(screen.getByTestId('list'));
    expect(list.previousElementSibling).toHaveClass('ui-list__spacer');
    expect(list.nextElementSibling).toHaveClass('ui-list__spacer');
  });

  it('drops the hairlines when asked, and keeps the rows it has not drawn at the app\'s own row height', () => {
    const many = Array.from({length: 300}, (_, index) => `Row ${index}`);
    render(<List data={many} renderItem={title => <ListItem>{title}</ListItem>} separators={false} estimatedItemHeight={72} testID="list"/>);
    expect(screen.getByTestId('list')).not.toHaveClass('ui-list--separated');
    // Nothing is laid out here: the first 1200 px of rows are drawn, and the rest is room.
    expect(screen.getAllByRole('listitem')).toHaveLength(17);
    const spacers = screen.getByTestId('list').querySelectorAll<HTMLElement>('.ui-list__spacer');
    expect(spacers[0]!.style.height).toBe('0px');
    expect(spacers[1]!.style.height).toBe(`${(300 - 17) * 72}px`);
  });

  it('puts the header before the rows and the footer after, and the empty state in place of no rows', () => {
    const {unmount} = render(
      <List data={[]} renderItem={() => null} header={<p>Header</p>} empty={<p>Nothing yet</p>} footer={<p>Footer</p>} testID="list"/>,
    );
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByTestId('list').textContent).toBe('HeaderNothing yetFooter');
    unmount();
    render(<List data={['One']} renderItem={title => <ListItem>{title}</ListItem>} header={<p>Header</p>} footer={<p>Footer</p>} empty={<p>Nothing yet</p>} testID="list"/>);
    expect(screen.getByTestId('list').textContent).toBe('HeaderOneFooter');
  });

  it('pads its content by the screen\'s bar and its own insets, inside the scroller', () => {
    render(
      <ScrollInsetsContext.Provider value={{top: 80, bottom: 0, left: 0, right: 0, automatic: false}}>
        <List data={rows} renderItem={title => <ListItem>{title}</ListItem>} contentInset={{top: 8, bottom: 20, left: 16, right: 4}} style={{marginTop: 4}} testID="list"/>
      </ScrollInsetsContext.Provider>,
    );
    const list = screen.getByTestId('list');
    expect(list.style.paddingTop).toBe('88px');
    expect(list.style.paddingBottom).toBe('20px');
    // The sides are the list's own, inside the scroller too.
    expect(list.style.paddingLeft).toBe('16px');
    expect(list.style.paddingRight).toBe('4px');
    // A row the keyboard focus scrolls into view stops clear of the bar.
    expect(list.style.scrollPaddingTop).toBe('88px');
    expect(list.style.scrollPaddingBottom).toBe('20px');
    expect(list.style.marginTop).toBe('4px');
  });

  it('scrolls itself, filling the space its parent gives it, and leaves the rows to the window', async () => {
    const {readFileSync} = await import('node:fs');
    const {join} = await import('node:path');
    const css = readFileSync(join(__dirname, 'list.css'), 'utf8');
    const root = /\.ui-list \{([^}]*)\}/.exec(css)![1];
    expect(root).toContain('overflow-y: auto;');
    // A basis of auto: in a parent with no height of its own the list grows to its rows.
    expect(root).toContain('flex: 1 1 auto;');
    expect(root).toContain('min-height: 0;');
    // Padding in `style` stays inside the full width.
    expect(root).toContain('box-sizing: border-box;');
    // A flex column, so an empty state that grows fills it between the header and the footer.
    expect(root).toContain('display: flex;');
    expect(root).toContain('flex-direction: column;');
    expect(/\.ui-list__rows \{([^}]*)\}/.exec(css)![1]).toContain('flex: none;');
    // Never a scroll anchor, so the drawn rows hold still while a spacer changes.
    expect(/\.ui-list__spacer \{([^}]*)\}/.exec(css)![1]).toContain('overflow-anchor: none;');
    // A row skipped by the browser would report the estimate as its height.
    expect(css).not.toContain('content-visibility');
  });

  it('grows to its rows in a parent with a height when its style stops it shrinking', () => {
    render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} style={{flexShrink: 0}} testID="list"/>);
    // Over the stylesheet's `flex: 1 1 auto`: the parent scrolls the list.
    expect(screen.getByTestId('list').style.flexShrink).toBe('0');
  });
});

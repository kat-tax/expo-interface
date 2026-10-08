import {render, screen} from '@testing-library/react';
import {ListItem} from '../list-item';
import {ScrollInsetsContext} from '../screen/insets';
import {List} from '.';

const rows = ['Essay', 'Notes', 'Sketch'];

/** jsdom has no IntersectionObserver; one that hands its callback out. */
let observe: ((entries: {isIntersecting: boolean}[]) => void) | null = null;
const disconnect = vi.fn();

describe('List (web)', () => {
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

  it('is a DOM list of the rows, each laid out as it comes into view, with hairlines between them', () => {
    render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} keyExtractor={title => title} testID="list"/>);
    const list = screen.getByRole('list');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items.map(item => item.textContent)).toEqual(rows);
    expect(items[0]).toHaveClass('ui-list__row');
    expect(screen.getByTestId('list')).toHaveClass('ui-list--separated');
    expect(screen.getByTestId('list').style.getPropertyValue('--ui-list-row')).toBe('56px');
    expect(list.parentElement).toBe(screen.getByTestId('list'));
  });

  it('drops the hairlines when asked, and takes a row height of the app\'s own', () => {
    render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} separators={false} estimatedItemHeight={72} testID="list"/>);
    expect(screen.getByTestId('list')).not.toHaveClass('ui-list--separated');
    expect(screen.getByTestId('list').style.getPropertyValue('--ui-list-row')).toBe('72px');
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

  it('reports the end once the last row is in view, and stops watching when it goes', () => {
    const onEndReached = vi.fn();
    const {unmount} = render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>} onEndReached={onEndReached}/>);
    observe!([{isIntersecting: false}]);
    expect(onEndReached).not.toHaveBeenCalled();
    observe!([{isIntersecting: true}]);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('watches nothing without a handler, or with nothing to watch', () => {
    observe = null;
    render(<List data={rows} renderItem={title => <ListItem>{title}</ListItem>}/>);
    expect(observe).toBeNull();
    render(<List data={[]} renderItem={() => null} onEndReached={() => {}}/>);
    expect(observe).toBeNull();
  });

  it('pads its content by the screen\'s bar and its own insets, inside the scroller', () => {
    render(
      <ScrollInsetsContext.Provider value={{top: 80, bottom: 0, automatic: false}}>
        <List data={rows} renderItem={title => <ListItem>{title}</ListItem>} contentInset={{top: 8, bottom: 20}} style={{marginTop: 4}} testID="list"/>
      </ScrollInsetsContext.Provider>,
    );
    const list = screen.getByTestId('list');
    expect(list.style.paddingTop).toBe('88px');
    expect(list.style.paddingBottom).toBe('20px');
    // A row the keyboard focus scrolls into view stops clear of the bar.
    expect(list.style.scrollPaddingTop).toBe('88px');
    expect(list.style.scrollPaddingBottom).toBe('20px');
    expect(list.style.marginTop).toBe('4px');
  });

  it('scrolls itself, filling the space its parent gives it', async () => {
    const {readFileSync} = await import('node:fs');
    const {join} = await import('node:path');
    const css = readFileSync(join(__dirname, 'list.css'), 'utf8');
    const root = /\.ui-list \{([^}]*)\}/.exec(css)![1];
    expect(root).toContain('overflow-y: auto;');
    // A basis of auto: in a parent with no height of its own the list grows to its rows.
    expect(root).toContain('flex: 1 1 auto;');
    expect(root).toContain('min-height: 0;');
    expect(/\.ui-list__rows \{([^}]*)\}/.exec(css)![1]).toContain('flex: none;');
  });
});

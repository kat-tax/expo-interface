import {clampPage, dotLabel, pageAt, pages} from './shared';

describe('Pager logic', () => {
  it('counts the pages it was given', () => {
    expect(pages(['one', 'two', 'three'])).toHaveLength(3);
    expect(pages(null)).toHaveLength(0);
  });

  it('brings a page index inside the pager', () => {
    expect(clampPage(1, 3)).toBe(1);
    expect(clampPage(-2, 3)).toBe(0);
    expect(clampPage(9, 3)).toBe(2);
    // A pager with nothing in it is on page zero, not page minus one.
    expect(clampPage(2, 0)).toBe(0);
  });

  it('reads the page from how far the scroller has gone', () => {
    expect(pageAt(0, 300, 3)).toBe(0);
    // The page flips at the halfway mark, as a dragged pager should.
    expect(pageAt(149, 300, 3)).toBe(0);
    expect(pageAt(151, 300, 3)).toBe(1);
    expect(pageAt(600, 300, 3)).toBe(2);
    // Past the end, which a rubber-banding scroller reports mid-bounce.
    expect(pageAt(900, 300, 3)).toBe(2);
    // Before it has been measured there is nowhere to have scrolled to.
    expect(pageAt(400, 0, 3)).toBe(0);
  });

  it('names a dot, which says nothing on its own', () => {
    expect(dotLabel(0, 3)).toBe('Page 1 of 3');
    expect(dotLabel(2, 3)).toBe('Page 3 of 3');
  });
});

import {ESTIMATED_ROW, keyOf, showsEmpty} from './shared';

describe('keyOf', () => {
  it('takes the app\'s key, or the index', () => {
    expect(keyOf({keyExtractor: (item: {id: string}) => item.id}, {id: 'a'}, 3)).toBe('a');
    expect(keyOf({}, {id: 'a'}, 3)).toBe('3');
    expect(ESTIMATED_ROW).toBe(56);
  });
});

describe('showsEmpty', () => {
  it('shows the empty content only with no rows and something to show', () => {
    expect(showsEmpty({data: [], empty: 'Nothing yet'})).toBe(true);
    expect(showsEmpty({data: [], empty: undefined})).toBe(false);
    expect(showsEmpty({data: [], empty: null})).toBe(false);
    expect(showsEmpty({data: ['One'], empty: 'Nothing yet'})).toBe(false);
  });
});

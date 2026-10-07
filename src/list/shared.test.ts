import {ESTIMATED_ROW, keyOf} from './shared';

describe('keyOf', () => {
  it('takes the app\'s key, or the index', () => {
    expect(keyOf({keyExtractor: (item: {id: string}) => item.id}, {id: 'a'}, 3)).toBe('a');
    expect(keyOf({}, {id: 'a'}, 3)).toBe('3');
    expect(ESTIMATED_ROW).toBe(56);
  });
});

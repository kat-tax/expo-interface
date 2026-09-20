import {chipKind, nextSelected} from './shared';

describe('Chip logic', () => {
  it('is a filter as soon as it is given a state, and an action without one', () => {
    expect(chipKind({selected: true})).toBe('filter');
    // False is a state too: a filter that is off is still a filter.
    expect(chipKind({selected: false})).toBe('filter');
    expect(chipKind({})).toBe('action');
  });

  it('reports the state a press would move it to', () => {
    expect(nextSelected({selected: false})).toBe(true);
    expect(nextSelected({selected: true})).toBe(false);
    // An action chip has no state; pressing it is still a press, and `true`
    // is what a caller that started listening would expect to hear.
    expect(nextSelected({})).toBe(true);
  });
});

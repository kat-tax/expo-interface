import {BAR_HEIGHT, BAR_SIDE, actionVariant, hasBar, horizontalInset, sub} from './shared';

describe('the sheet\'s chrome', () => {
  it('has ends the same width and a bar taller than a row', () => {
    expect(BAR_SIDE).toBe(56);
    expect(BAR_HEIGHT).toBe(56);
  });

  it('takes the sheet\'s padding off a body\'s width: the platforms\' 16 a side, or what contentPadding says', () => {
    expect(horizontalInset(undefined)).toBe(32);
    expect(horizontalInset(0)).toBe(0);
    expect(horizontalInset(12)).toBe(24);
    expect(horizontalInset({left: 8, right: 4})).toBe(12);
    expect(horizontalInset({top: 8})).toBe(0);
  });

  it('fills the last action and outlines the rest, unless an action says otherwise', () => {
    const actions = [{label: 'Cancel'}, {label: 'Delete', variant: 'text' as const}, {label: 'Save'}];
    expect(actions.map((action, index) => actionVariant(action, index, actions.length))).toEqual(['outlined', 'text', 'filled']);
  });

  it('draws the bar for a title, a back button, a close button or a menu, and not for an empty menu', () => {
    expect(hasBar({})).toBe(false);
    expect(hasBar({menu: []})).toBe(false);
    expect(hasBar({title: 'Comments'})).toBe(true);
    expect(hasBar({onBack: () => {}})).toBe(true);
    expect(hasBar({onClose: () => {}})).toBe(true);
    expect(hasBar({menu: [{label: 'Resolve all'}]})).toBe(true);
  });

  it('names a child under the sheet\'s test identifier, or not at all', () => {
    expect(sub('sheet', 'bar')).toBe('sheet-bar');
    expect(sub(undefined, 'bar')).toBeUndefined();
  });
});

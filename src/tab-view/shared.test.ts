import {TAB_BREAKPOINT, closeLabel, nextSelection, resolveLayout, switcherLabel, tabIndex} from './shared';

const TABS = [
  {id: 'a', title: 'Notes'},
  {id: 'b', title: 'Sketch'},
  {id: 'c', title: 'Readme'},
];

describe('resolveLayout', () => {
  it('takes the strip from the breakpoint up and the switcher below it', () => {
    expect(resolveLayout('auto', TAB_BREAKPOINT)).toBe('strip');
    expect(resolveLayout('auto', TAB_BREAKPOINT - 1)).toBe('switcher');
  });

  it('leaves a caller who has already decided alone, at any width', () => {
    expect(resolveLayout('strip', 320)).toBe('strip');
    expect(resolveLayout('switcher', 1400)).toBe('switcher');
  });
});

describe('tabIndex', () => {
  it('finds a tab, and answers -1 for an id no tab has', () => {
    expect(tabIndex(TABS, 'b')).toBe(1);
    expect(tabIndex(TABS, 'gone')).toBe(-1);
  });
});

describe('nextSelection', () => {
  it('changes nothing when the tab closing is not the open one', () => {
    expect(nextSelection(TABS, 'c', 'a')).toBe('a');
  });

  it('moves to the next tab when the open one closes', () => {
    expect(nextSelection(TABS, 'b', 'b')).toBe('c');
  });

  it('falls back to the previous tab when the last one closes', () => {
    expect(nextSelection(TABS, 'c', 'c')).toBe('b');
  });

  it('leaves nothing open when the only tab closes', () => {
    expect(nextSelection([TABS[0]!], 'a', 'a')).toBeUndefined();
  });

  it('moves nothing for an id no tab has, which closes nothing', () => {
    expect(nextSelection(TABS, 'gone', 'gone')).toBe('gone');
  });
});

describe('switcherLabel', () => {
  it('says which tab is open and how many there are', () => {
    expect(switcherLabel(TABS, 'b')).toBe('Sketch, 3 tabs');
  });

  it('counts one tab in the singular', () => {
    expect(switcherLabel([TABS[0]!], 'a')).toBe('Notes, 1 tab');
  });

  it('says the count alone when nothing is open', () => {
    expect(switcherLabel(TABS, 'gone')).toBe('3 tabs');
  });
});

describe('closeLabel', () => {
  it('names the tab, since a cross says nothing on its own', () => {
    expect(closeLabel(TABS[0]!)).toBe('Close Notes');
  });
});

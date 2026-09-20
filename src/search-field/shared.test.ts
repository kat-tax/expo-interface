import {describe, expect, it} from 'vitest';
import {canClear, matchingSuggestions} from './shared';

const suggestions = ['HIS-201 Midterm Essay', 'Demo Reel', 'Project X Assets'];

describe('matchingSuggestions', () => {
  it('matches anywhere in the text, not only at the start', () => {
    // Someone searching file names is as likely to remember the middle.
    expect(matchingSuggestions('reel', suggestions)).toEqual(['Demo Reel']);
    expect(matchingSuggestions('midterm', suggestions)).toEqual(['HIS-201 Midterm Essay']);
  });

  it('offers nothing until something has been typed', () => {
    expect(matchingSuggestions('', suggestions)).toEqual([]);
    expect(matchingSuggestions('   ', suggestions)).toEqual([]);
    expect(matchingSuggestions('demo', undefined)).toEqual([]);
  });

  it('offers nothing when nothing matches', () => {
    expect(matchingSuggestions('zzz', suggestions)).toEqual([]);
  });
});

describe('canClear', () => {
  const base = {value: '', onChangeText: () => {}};

  it('has something to do only when there is text and the field is usable', () => {
    expect(canClear({...base, value: 'demo'})).toBe(true);
    expect(canClear(base)).toBe(false);
    expect(canClear({...base, value: 'demo', clearable: false})).toBe(false);
    expect(canClear({...base, value: 'demo', disabled: true})).toBe(false);
  });
});

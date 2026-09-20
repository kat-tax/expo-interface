import {describe, expect, it} from 'vitest';
import {badgeLabel, badgeText, badgeValue} from './shared';

describe('badgeText', () => {
  it('is the count', () => {
    expect(badgeText({count: 3})).toBe('3');
    expect(badgeText({count: 42})).toBe('42');
  });

  it('is nothing at all without a count', () => {
    expect(badgeText({})).toBeNull();
  });

  it('is nothing for zero, because a count of nothing is not news', () => {
    expect(badgeText({count: 0})).toBeNull();
    expect(badgeText({count: 0, showZero: true})).toBe('0');
  });

  it('stops growing past max, so a badge cannot shove a layout around', () => {
    expect(badgeText({count: 100})).toBe('99+');
    expect(badgeText({count: 99})).toBe('99');
    expect(badgeText({count: 10, max: 9})).toBe('9+');
  });

  it('is empty for a dot, which has a size but no number', () => {
    expect(badgeText({dot: true})).toBe('');
    // A dot is what was asked for even when a count came with it.
    expect(badgeText({dot: true, count: 5})).toBe('');
  });
});

describe('badgeValue', () => {
  it('is the number WinUI\'s InfoBadge takes, clamped to max because it cannot draw a "+"', () => {
    expect(badgeValue({count: 3})).toBe(3);
    expect(badgeValue({count: 150})).toBe(99);
    expect(badgeValue({count: 150, max: 9})).toBe(9);
  });

  it('is negative for a dot or for no count at all, which is how that control is told to draw one', () => {
    expect(badgeValue({dot: true})).toBe(-1);
    expect(badgeValue({})).toBe(-1);
  });
});

describe('badgeLabel', () => {
  it('prefers what the caller said, because a number alone announces nothing', () => {
    expect(badgeLabel({count: 3, label: '3 unread messages'}, '3')).toBe('3 unread messages');
  });

  it('falls back to something a screen reader can make sense of', () => {
    expect(badgeLabel({count: 3}, '3')).toBe('3 new');
    expect(badgeLabel({count: 150}, '99+')).toBe('99+ new');
    expect(badgeLabel({dot: true}, '')).toBe('New');
  });
});

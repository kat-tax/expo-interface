import {AVATAR_COLORS, colorOf, initialsOf} from './shared';

describe('Avatar shared', () => {
  it('takes the first and last words for the initials', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('Ada Byron King Lovelace')).toBe('AL');
    expect(initialsOf('  ada  ')).toBe('AD');
    expect(initialsOf('')).toBe('');
    expect(initialsOf('   ')).toBe('');
  });

  it('hashes a name to a stable color from the palette', () => {
    expect(colorOf('Ada Lovelace')).toBe(colorOf('Ada Lovelace'));
    expect(AVATAR_COLORS).toContain(colorOf('Ada Lovelace'));
    expect(AVATAR_COLORS).toContain(colorOf(''));
    // Different names generally land on different circles.
    const hues = new Set(['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara'].map(colorOf));
    expect(hues.size).toBeGreaterThan(1);
  });
});

import {fraction, gauge, markerOffset, withAlpha} from './shared';

describe('Gauge shared', () => {
  it('maps a value to its clamped fraction of the range', () => {
    expect(fraction(0.5, 0, 1)).toBe(0.5);
    expect(fraction(211, 0, 260)).toBeCloseTo(211 / 260);
    expect(fraction(-5, 0, 1)).toBe(0);
    expect(fraction(7, 0, 1)).toBe(1);
    expect(fraction(30, 20, 40)).toBe(0.5);
  });

  it('treats an empty or inverted range as empty', () => {
    expect(fraction(1, 1, 1)).toBe(0);
    expect(fraction(5, 10, 0)).toBe(0);
  });

  it('places the circular marker along the 240° arc that opens at the bottom', () => {
    const radius = (gauge.ring.size - gauge.ring.stroke) / 2;
    const start = markerOffset(0);
    // 150°: lower left, on the stroke's center line.
    expect(start.x).toBeCloseTo(radius * Math.cos((150 * Math.PI) / 180));
    expect(start.y).toBeCloseTo(radius * Math.sin((150 * Math.PI) / 180));
    const top = markerOffset(0.5);
    expect(top.x).toBeCloseTo(0);
    expect(top.y).toBeCloseTo(-radius);
    const end = markerOffset(1);
    expect(end.x).toBeCloseTo(-start.x);
    expect(end.y).toBeCloseTo(start.y);
  });

  it('replaces the alpha of hex colors and leaves other syntaxes alone', () => {
    expect(withAlpha('#007AFF', 0.3)).toBe('#007AFF4D');
    expect(withAlpha('#abc', 1)).toBe('#AABBCCFF');
    expect(withAlpha('#11223344', 0)).toBe('#11223300');
    expect(withAlpha(' #FF9500 ', 0.5)).toBe('#FF950080');
    expect(withAlpha('rgb(1, 2, 3)', 0.3)).toBe('rgb(1, 2, 3)');
    expect(withAlpha('tomato', 0.3)).toBe('tomato');
  });
});

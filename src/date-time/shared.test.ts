import {formatValue, inputType, parseInputValue, toInputValue, withDatePart, withTimePart} from './shared';

const JUNE_15 = new Date(2026, 5, 15, 9, 5, 42, 123);

describe('formatValue', () => {
  it('formats a calendar day', () => {
    expect(formatValue(JUNE_15, 'date')).toBe('15 Jun 2026');
  });

  it('formats a 12-hour time with zero-padded minutes', () => {
    expect(formatValue(JUNE_15, 'time')).toMatch(/^9:05\sAM$/);
    expect(formatValue(new Date(2026, 5, 15, 17, 30), 'time')).toMatch(/^5:30\sPM$/);
    expect(formatValue(new Date(2026, 5, 15, 0, 0), 'time')).toMatch(/^12:00\sAM$/);
  });

  it('joins date and time for datetime mode', () => {
    expect(formatValue(JUNE_15, 'datetime')).toMatch(/^15 Jun 2026, 9:05\sAM$/);
  });
});

describe('inputType', () => {
  it('maps each mode to the HTML input type', () => {
    expect(inputType('date')).toBe('date');
    expect(inputType('time')).toBe('time');
    expect(inputType('datetime')).toBe('datetime-local');
  });
});

describe('toInputValue', () => {
  it('serialises local date, time and datetime strings with zero padding', () => {
    expect(toInputValue(JUNE_15, 'date')).toBe('2026-06-15');
    expect(toInputValue(JUNE_15, 'time')).toBe('09:05');
    expect(toInputValue(JUNE_15, 'datetime')).toBe('2026-06-15T09:05');
  });

  it('drops seconds and milliseconds', () => {
    expect(toInputValue(new Date(2026, 0, 1, 23, 59, 59, 999), 'datetime')).toBe('2026-01-01T23:59');
  });
});

describe('parseInputValue', () => {
  it('returns null for empty input', () => {
    expect(parseInputValue('', 'date', JUNE_15)).toBeNull();
    expect(parseInputValue('', 'time', JUNE_15)).toBeNull();
    expect(parseInputValue('', 'datetime', JUNE_15)).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseInputValue('garbage', 'date', JUNE_15)).toBeNull();
    expect(parseInputValue('2026-xx-01', 'date', JUNE_15)).toBeNull();
    expect(parseInputValue('ab:cd', 'time', JUNE_15)).toBeNull();
  });

  it('replaces the calendar day and keeps the time in date mode', () => {
    const next = parseInputValue('2030-01-02', 'date', JUNE_15);
    expect(next?.getTime()).toBe(new Date(2030, 0, 2, 9, 5, 42, 123).getTime());
  });

  it('replaces the time and keeps the day in time mode, zeroing seconds', () => {
    const next = parseInputValue('17:45', 'time', JUNE_15);
    expect(next?.getTime()).toBe(new Date(2026, 5, 15, 17, 45, 0, 0).getTime());
  });

  it('replaces both parts in datetime mode', () => {
    const next = parseInputValue('2030-01-02T17:45', 'datetime', JUNE_15);
    expect(next?.getTime()).toBe(new Date(2030, 0, 2, 17, 45, 0, 0).getTime());
  });

  it('keeps the base time when the datetime string has no time part', () => {
    const next = parseInputValue('2030-01-02', 'datetime', JUNE_15);
    expect(next?.getTime()).toBe(new Date(2030, 0, 2, 9, 5, 42, 123).getTime());
  });

  it('ignores a malformed time part in datetime mode', () => {
    const next = parseInputValue('2030-01-02Tnope', 'datetime', JUNE_15);
    expect(next?.getTime()).toBe(new Date(2030, 0, 2, 9, 5, 42, 123).getTime());
  });

  it('does not mutate the base date', () => {
    const base = new Date(JUNE_15);
    parseInputValue('2030-01-02T17:45', 'datetime', base);
    expect(base.getTime()).toBe(JUNE_15.getTime());
  });

  it('round-trips toInputValue', () => {
    for (const mode of ['date', 'time', 'datetime'] as const) {
      const next = parseInputValue(toInputValue(JUNE_15, mode), mode, JUNE_15);
      expect(next && toInputValue(next, mode)).toBe(toInputValue(JUNE_15, mode));
    }
  });
});

describe('withDatePart', () => {
  it('takes the day from picked and the time from base', () => {
    const next = withDatePart(JUNE_15, new Date(2030, 0, 2, 23, 59));
    expect(next.getTime()).toBe(new Date(2030, 0, 2, 9, 5, 42, 123).getTime());
  });

  it('returns a new instance', () => {
    const next = withDatePart(JUNE_15, JUNE_15);
    expect(next).not.toBe(JUNE_15);
    expect(next.getTime()).toBe(JUNE_15.getTime());
  });
});

describe('withTimePart', () => {
  it('takes the hours and minutes from picked and the day from base', () => {
    const next = withTimePart(JUNE_15, new Date(2000, 0, 1, 18, 45, 30));
    expect(next.getTime()).toBe(new Date(2026, 5, 15, 18, 45, 0, 0).getTime());
  });

  it('returns a new instance', () => {
    expect(withTimePart(JUNE_15, JUNE_15)).not.toBe(JUNE_15);
  });
});

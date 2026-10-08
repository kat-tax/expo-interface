import {dayOf, fromUtcDay, parseDay, toDate, utcDayOf} from './shared';

describe('days', () => {
  it('writes a date\'s local calendar day as YYYY-MM-DD, and reads one back as its local midnight', () => {
    expect(dayOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(parseDay('2026-12-24')?.getTime()).toBe(new Date(2026, 11, 24).getTime());
    expect(parseDay('24/12/2026')).toBeUndefined();
    expect(parseDay('2026-1-5')).toBeUndefined();
  });

  it('reads no day the calendar does not have, rather than rolling it into another', () => {
    for (const day of ['2026-02-30', '2023-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00']) {
      expect(parseDay(day)).toBeUndefined();
    }
    expect(parseDay('2024-02-29')?.getTime()).toBe(new Date(2024, 1, 29).getTime());
  });

  it('reads and writes a year before 1000 as that year, in four digits', () => {
    const early = parseDay('0050-06-15')!;
    expect([early.getFullYear(), early.getMonth(), early.getDate(), early.getHours()]).toEqual([50, 5, 15, 0]);
    expect(dayOf(early)).toBe('0050-06-15');
    expect(dayOf(parseDay('0999-12-31')!)).toBe('0999-12-31');
    const year999 = new Date(2000, 0, 5);
    year999.setFullYear(999, 0, 5);
    expect(dayOf(year999)).toBe('0999-01-05');
    expect(toDate('0050-06-15')?.getFullYear()).toBe(50);
  });

  it('takes a value as a Date or a day, and nothing as nothing', () => {
    const date = new Date(2026, 5, 15, 9, 30);
    expect(toDate(date)).toBe(date);
    expect(toDate('2026-06-15')?.getTime()).toBe(new Date(2026, 5, 15).getTime());
    expect(toDate(undefined)).toBeUndefined();
  });

  it('hands Material\'s date dialog the local day at midnight UTC, and reads its answer back as the local day', () => {
    // Late on the 15th, local: west of Greenwich that instant is the 16th in UTC.
    const late = new Date(2026, 5, 15, 23, 30);
    expect(utcDayOf(late).getTime()).toBe(Date.UTC(2026, 5, 15));
    // The dialog's answer for the 24th is midnight UTC of the 24th, whatever the zone.
    const picked = fromUtcDay(new Date(Date.UTC(2026, 11, 24)));
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate(), picked.getHours()]).toEqual([2026, 11, 24, 0]);
  });

  it('keeps a year before 100 on the way to Material\'s dialog and back', () => {
    // `Date.UTC(50, 5, 15)` is 1950, so the expectation is written as a string.
    expect(utcDayOf(parseDay('0050-06-15')!).toISOString()).toBe('0050-06-15T00:00:00.000Z');
    const picked = fromUtcDay(new Date('0050-06-15T00:00:00.000Z'));
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate(), picked.getHours()]).toEqual([50, 5, 15, 0]);
  });
});

import {dayOf, fromUtcDay, parseDay, toDate, utcDayOf} from './shared';

describe('days', () => {
  it('writes a date\'s local calendar day as YYYY-MM-DD, and reads one back as its local midnight', () => {
    expect(dayOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(parseDay('2026-12-24')?.getTime()).toBe(new Date(2026, 11, 24).getTime());
    expect(parseDay('24/12/2026')).toBeUndefined();
    expect(parseDay('2026-1-5')).toBeUndefined();
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
});

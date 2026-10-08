import type {DateTimeMode, DateTimeValue} from './types';
import {useCallback, useState} from 'react';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Formats a value the way it appears inside the pill,
 * e.g. `15 Jun 2026` or `9:00 AM`.
 * @param date - The date to format.
 * @param mode - The mode of the date time picker.
 * @returns The formatted date as a string.
 */
export function formatValue(date: Date, mode: DateTimeMode): string {
  switch (mode) {
    case 'date':
      return dateFormatter.format(date);
    case 'time':
      return timeFormatter.format(date);
    case 'datetime':
    default:
      return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;
  }
}

/**
 * Bridges controlled and uncontrolled usage. When `value` is provided the
 * component is controlled; otherwise it falls back to internal state. A
 * value given as a `YYYY-MM-DD` day is read as that day's local midnight,
 * and every change is reported with the local day it falls on.
 * @param value - The current value of the date time picker.
 * @param onChange - The function to call when the date time picker value changes.
 * @returns The current value and the function to call when the date time picker value changes.
 */
export function useDateValue(
  value: DateTimeValue | undefined,
  onChange: ((date: Date, day: string) => void) | undefined,
): [Date, (next: Date) => void] {
  const given = toDate(value);
  const [internal, setInternal] = useState(() => given ?? new Date());
  const current = given ?? internal;
  const setValue = useCallback(
    (next: Date) => {
      if (value === undefined) {
        setInternal(next);
      }
      onChange?.(next, dayOf(next));
    },
    [value, onChange],
  );
  return [current, setValue];
}

/** A date's local calendar day, as `YYYY-MM-DD`, the year in four digits. */
export function dayOf(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A `YYYY-MM-DD` day as its local midnight; `undefined` for anything else, a
 * day the calendar does not have (`2026-02-30`) among them.
 */
export function parseDay(day: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return undefined;
  const midnight = localMidnight(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // A day the calendar does not have rolls into another (2026-02-30 is
  // 2 March), so it is no day.
  return dayOf(midnight) === day ? midnight : undefined;
}

/**
 * The local midnight of a day, any year: `new Date(y, m, d)` reads the years
 * 0 to 99 as 1900 to 1999, where `setFullYear` takes the year as given.
 */
function localMidnight(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  return date;
}

/** A value as a `Date`: a day string read as its local midnight, a `Date` as it is. */
export function toDate(value: DateTimeValue | undefined): Date | undefined {
  return typeof value === 'string' ? parseDay(value) : value;
}

/**
 * The instant Material's date dialog shows as a date's local day: midnight
 * UTC of that day, since the dialog keeps its days in UTC. The local
 * instant itself shows as the day before, west of Greenwich, before noon.
 */
export function utcDayOf(date: Date): Date {
  // `Date.UTC` reads the years 0 to 99 as 1900 to 1999, `setUTCFullYear` does not.
  const utc = new Date(0);
  utc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return utc;
}

/** The local day Material's date dialog picked, from its answer at midnight UTC. */
export function fromUtcDay(picked: Date): Date {
  return localMidnight(picked.getUTCFullYear(), picked.getUTCMonth(), picked.getUTCDate());
}

/**
 * Replaces the calendar day of `base` with the one from `picked`, keeping the time.
 * @param base - The base date to replace the calendar day of.
 * @param picked - The date to replace the calendar day of `base` with.
 * @returns The date with the calendar day replaced.
 */
export function withDatePart(base: Date, picked: Date): Date {
  const next = new Date(base);
  next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return next;
}

/**
 * Replaces the time of `base` with the one from `picked`, keeping the calendar day.
 * @param base - The base date to replace the time of.
 * @param picked - The date to replace the time of `base` with.
 * @returns The date with the time replaced.
 */
export function withTimePart(base: Date, picked: Date): Date {
  const next = new Date(base);
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

/**
 * The HTML input `type` that matches a given mode.
 * @param mode - The mode of the date time picker.
 * @returns The HTML input `type` that matches the given mode.
 */
export function inputType(mode: DateTimeMode): 'date' | 'time' | 'datetime-local' {
  switch (mode) {
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'datetime':
    default:
      return 'datetime-local';
  }
}

/**
 * Serializes a `Date` into the local-time string an HTML input expects.
 * @param date - The date to serialize.
 * @param mode - The mode of the date time picker.
 * @returns The serialized date as a string.
 */
export function toInputValue(date: Date, mode: DateTimeMode): string {
  const datePart = dayOf(date);
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  switch (mode) {
    case 'date':
      return datePart;
    case 'time':
      return timePart;
    case 'datetime':
    default:
      return `${datePart}T${timePart}`;
  }
}

/**
 * Parses an HTML input value back into a `Date`, merging it onto `base` so the
 * untouched component (date or time) is preserved. Returns `null` for empty or
 * malformed input.
 * @param raw - The raw input value to parse.
 * @param mode - The mode of the date time picker.
 * @param base - The base date to merge the parsed value onto.
 * @returns The parsed date or null if the input is empty or malformed.
 */
export function parseInputValue(raw: string, mode: DateTimeMode, base: Date): Date | null {
  if (!raw) {
    return null;
  }
  if (mode === 'time') {
    const [hours, minutes] = raw.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }
    const next = new Date(base);
    next.setHours(hours, minutes, 0, 0);
    return next;
  }
  const [datePart, timePart] = raw.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  const next = new Date(base);
  next.setFullYear(year, month - 1, day);
  if (mode === 'datetime' && timePart) {
    const [hours, minutes] = timePart.split(':').map(Number);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      next.setHours(hours, minutes, 0, 0);
    }
  }
  return next;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

import type {DateTimeMode} from './types';
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
 * component is controlled; otherwise it falls back to internal state.
 * @param value - The current value of the date time picker.
 * @param onChange - The function to call when the date time picker value changes.
 * @returns The current value and the function to call when the date time picker value changes.
 */
export function useDateValue(
  value: Date | undefined,
  onChange: ((date: Date) => void) | undefined,
): [Date, (next: Date) => void] {
  const [internal, setInternal] = useState(() => value ?? new Date());
  const current = value ?? internal;
  const setValue = useCallback(
    (next: Date) => {
      if (value === undefined) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [value, onChange],
  );
  return [current, setValue];
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
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

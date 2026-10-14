import type { ISODate, ISODateTime } from '../types/domain';

const MS_PER_MINUTE = 60_000;

const pad = (value: number) => String(value).padStart(2, '0');

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value: string | null | undefined): value is ISODate {
  return !!value && ISO_DATE_PATTERN.test(value) && !Number.isNaN(parseISODate(value).getTime());
}

export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

/** Parses a `YYYY-MM-DD` string as a local-time date (not UTC). */
export function parseISODate(value: ISODate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: ISODate, days: number): ISODate {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function dateOfTimestamp(value: ISODateTime): ISODate {
  return toISODate(new Date(value));
}

export function minutesSince(value: ISODateTime, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / MS_PER_MINUTE));
}

export function minutesBetween(from: ISODateTime, to: ISODateTime): number {
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / MS_PER_MINUTE));
}

export function ageInYears(dateOfBirth: ISODate | null, today: Date = new Date()): number | null {
  if (!dateOfBirth) return null;
  const dob = parseISODate(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

import { CURRENCY, LOCALE } from '../config';
import type { Gender, ISODate, ISODateTime, Patient, PaymentMethod } from '../types/domain';
import { addDays, ageInYears, parseISODate, todayISO } from './date';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });

const timeFormatter = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' });

export const formatCurrency = (amount: number) => currencyFormatter.format(amount);

export const formatDate = (value: ISODate) => longDateFormatter.format(parseISODate(value));

export const formatShortDate = (value: ISODate) => shortDateFormatter.format(parseISODate(value));

export const formatTime = (value: ISODateTime) => timeFormatter.format(new Date(value));

/** Formats an `HH:mm` slot, e.g. "14:30" → "2:30 pm". */
export function formatSlot(slot: string): string {
  const [hours, minutes] = slot.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return timeFormatter.format(date);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** "Today", "Tomorrow", "Yesterday", or the full date. */
export function formatRelativeDay(value: ISODate): string {
  const today = todayISO();
  if (value === today) return 'Today';
  if (value === addDays(today, 1)) return 'Tomorrow';
  if (value === addDays(today, -1)) return 'Yesterday';
  return formatDate(value);
}

const GENDER_LABELS: Record<Gender, string> = { female: 'Female', male: 'Male', other: 'Other' };

export const formatGender = (gender: Gender) => GENDER_LABELS[gender];

/** Compact patient descriptor, e.g. "34 y · Female". */
export function formatPatientMeta(patient: Pick<Patient, 'dateOfBirth' | 'gender'>): string {
  const age = ageInYears(patient.dateOfBirth);
  return [age === null ? null : `${age} y`, formatGender(patient.gender)].filter(Boolean).join(' · ');
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = { cash: 'Cash', card: 'Card', upi: 'UPI' };

export const formatPaymentMethod = (method: PaymentMethod) => PAYMENT_METHOD_LABELS[method];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

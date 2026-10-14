import type { PatientInput } from '../types/domain';
import { todayISO } from './date';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;

export const phoneDigits = (phone: string) => phone.replace(/\D/g, '');

/** Shared by the registration form and the mock API so both enforce the same rules. */
export function validatePatient(input: PatientInput, today = todayISO()): FieldErrors<PatientInput> {
  const errors: FieldErrors<PatientInput> = {};

  const name = input.name.trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Name looks too short';

  const digits = phoneDigits(input.phone);
  if (!digits) errors.phone = 'Phone number is required';
  else if (digits.length < 10 || digits.length > 13) errors.phone = 'Enter a valid phone number';

  if (input.email.trim() && !EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (input.dateOfBirth && input.dateOfBirth > today) {
    errors.dateOfBirth = 'Date of birth cannot be in the future';
  }

  return errors;
}

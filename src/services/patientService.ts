import { balanceDue } from '../lib/billing';
import { createId } from '../lib/id';
import { hasErrors, phoneDigits, validatePatient } from '../lib/validation';
import type { AppointmentDetails, ID, ISODate, Patient, PatientInput } from '../types/domain';
import { readDb, writeDb, type Database } from './db';
import { ApiError } from './errors';
import { request } from './request';
import { newestFirst, withDetails } from './selectors';

export interface PatientSummary extends Patient {
  visitCount: number;
  lastVisit: ISODate | null;
  /** Total unpaid amount across completed visits. */
  balanceDue: number;
}

export type PatientSort = 'name' | 'recent' | 'balance';

export interface PatientSearchParams {
  search?: string;
  sort?: PatientSort;
  limit?: number;
}

const byName = (a: PatientSummary, b: PatientSummary) => a.name.localeCompare(b.name);

const SORTERS: Record<PatientSort, (a: PatientSummary, b: PatientSummary) => number> = {
  name: byName,
  // Most recent visit first; patients who haven't visited yet go last.
  recent: (a, b) => (b.lastVisit ?? '').localeCompare(a.lastVisit ?? '') || byName(a, b),
  balance: (a, b) => b.balanceDue - a.balanceDue || byName(a, b),
};

function summarize(db: Database, patient: Patient): PatientSummary {
  const visits = db.appointments.filter((a) => a.patientId === patient.id && a.status === 'completed');
  return {
    ...patient,
    visitCount: visits.length,
    lastVisit: visits.reduce<ISODate | null>((latest, a) => (!latest || a.date > latest ? a.date : latest), null),
    balanceDue: visits.reduce((sum, a) => sum + balanceDue(a), 0),
  };
}

function matches(patient: Patient, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  const digits = phoneDigits(term);
  return (
    patient.name.toLowerCase().includes(term) ||
    (digits.length >= 3 && phoneDigits(patient.phone).includes(digits))
  );
}

function sanitize(input: PatientInput): PatientInput {
  return {
    ...input,
    name: input.name.trim().replace(/\s+/g, ' '),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    allergies: input.allergies.trim(),
    dateOfBirth: input.dateOfBirth || null,
  };
}

function assertValid(db: Database, input: PatientInput, ignoreId?: ID): void {
  const errors = validatePatient(input);
  if (hasErrors(errors)) {
    throw new ApiError(Object.values(errors)[0] ?? 'Invalid patient details.', 'VALIDATION');
  }
  // Families often share a phone number, so only flag an exact name + phone match.
  const duplicate = db.patients.find(
    (p) =>
      p.id !== ignoreId &&
      phoneDigits(p.phone) === phoneDigits(input.phone) &&
      p.name.toLowerCase() === input.name.toLowerCase(),
  );
  if (duplicate) {
    throw new ApiError(`${duplicate.name} is already registered with this phone number.`, 'CONFLICT');
  }
}

export const patientService = {
  list({ search = '', sort = 'name', limit }: PatientSearchParams = {}): Promise<PatientSummary[]> {
    return request(() => {
      const db = readDb();
      const results = db.patients
        .filter((p) => matches(p, search))
        .map((p) => summarize(db, p))
        .sort(SORTERS[sort]);
      return limit ? results.slice(0, limit) : results;
    });
  },

  get(id: ID): Promise<PatientSummary> {
    return request(() => {
      const db = readDb();
      const patient = db.patients.find((p) => p.id === id);
      if (!patient) throw new ApiError('Patient not found.', 'NOT_FOUND');
      return summarize(db, patient);
    });
  },

  history(patientId: ID): Promise<AppointmentDetails[]> {
    return request(() => {
      const db = readDb();
      return db.appointments
        .filter((a) => a.patientId === patientId)
        .sort(newestFirst)
        .map((a) => withDetails(db, a));
    });
  },

  create(input: PatientInput): Promise<Patient> {
    return request(() =>
      writeDb((db) => {
        const data = sanitize(input);
        assertValid(db, data);
        const patient: Patient = { ...data, id: createId('pat'), createdAt: new Date().toISOString() };
        db.patients.push(patient);
        return patient;
      }),
    );
  },

  update(id: ID, input: PatientInput): Promise<Patient> {
    return request(() =>
      writeDb((db) => {
        const patient = db.patients.find((p) => p.id === id);
        if (!patient) throw new ApiError('Patient not found.', 'NOT_FOUND');
        const data = sanitize(input);
        assertValid(db, data, id);
        Object.assign(patient, data);
        return patient;
      }),
    );
  },
};

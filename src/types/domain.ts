export type ID = string;
/** Calendar date in `YYYY-MM-DD` form, in the clinic's local time. */
export type ISODate = string;
/** Full ISO-8601 timestamp. */
export type ISODateTime = string;

export type Gender = 'female' | 'male' | 'other';

export interface Patient {
  id: ID;
  name: string;
  phone: string;
  gender: Gender;
  dateOfBirth: ISODate | null;
  email: string;
  address: string;
  allergies: string;
  createdAt: ISODateTime;
}

export type PatientInput = Omit<Patient, 'id' | 'createdAt'>;

export interface Doctor {
  id: ID;
  name: string;
  specialty: string;
  consultationFee: number;
  /** Used to estimate queue wait times. */
  avgConsultationMinutes: number;
}

/**
 * Lifecycle: scheduled → waiting (checked in) → in_consultation → completed.
 * Scheduled or waiting appointments can be cancelled.
 */
export type AppointmentStatus =
  | 'scheduled'
  | 'waiting'
  | 'in_consultation'
  | 'completed'
  | 'cancelled';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  diagnosis: string;
  medications: Medication[];
  advice: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface Payment {
  id: ID;
  amount: number;
  method: PaymentMethod;
  paidAt: ISODateTime;
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface Appointment {
  id: ID;
  patientId: ID;
  doctorId: ID;
  date: ISODate;
  /** Preferred slot as `HH:mm`; null for walk-ins. */
  time: string | null;
  /** Sequential token number for the day, shown to the patient. */
  token: number;
  reason: string;
  status: AppointmentStatus;
  /** Amount billed for the visit. */
  fee: number;
  payments: Payment[];
  prescription: Prescription | null;
  followUpDate: ISODate | null;
  createdAt: ISODateTime;
  checkedInAt: ISODateTime | null;
  startedAt: ISODateTime | null;
  completedAt: ISODateTime | null;
  cancelledAt: ISODateTime | null;
}

/** An appointment joined with its patient and doctor, as returned by the API. */
export interface AppointmentDetails extends Appointment {
  patient: Patient;
  doctor: Doctor;
}

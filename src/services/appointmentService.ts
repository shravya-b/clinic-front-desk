import { balanceDue } from '../lib/billing';
import { todayISO } from '../lib/date';
import { createId } from '../lib/id';
import type {
  Appointment,
  AppointmentDetails,
  AppointmentStatus,
  ID,
  ISODate,
  PaymentMethod,
  Prescription,
} from '../types/domain';
import { readDb, writeDb, type Database } from './db';
import { ApiError } from './errors';
import { request } from './request';
import { findAppointment, withDetails } from './selectors';

export interface AppointmentFilters {
  date: ISODate;
  doctorId?: ID | null;
}

export interface BookAppointmentInput {
  patientId: ID;
  doctorId: ID;
  date: ISODate;
  time: string | null;
  reason: string;
  /** Patient is at the clinic now: add straight to today's queue. */
  checkInNow: boolean;
}

export interface PaymentInput {
  amount: number;
  method: PaymentMethod;
}

export interface CompleteConsultationInput {
  prescription: Prescription;
  fee: number;
  /** Payment collected at checkout, if any. */
  payment: PaymentInput | null;
  followUpDate: ISODate | null;
}

const ACTIVE_STATUSES: AppointmentStatus[] = ['scheduled', 'waiting', 'in_consultation'];

function assertStatus(appointment: Appointment, allowed: AppointmentStatus[], action: string): void {
  if (!allowed.includes(appointment.status)) {
    throw new ApiError(`Cannot ${action}: the appointment is ${appointment.status.replace('_', ' ')}.`, 'CONFLICT');
  }
}

function validatePayment(appointment: Appointment, payment: PaymentInput): void {
  if (!(payment.amount > 0)) throw new ApiError('Payment amount must be greater than zero.', 'VALIDATION');
  if (payment.amount > balanceDue(appointment)) {
    throw new ApiError('Payment cannot exceed the balance due.', 'VALIDATION');
  }
}

function addPayment(appointment: Appointment, payment: PaymentInput): void {
  validatePayment(appointment, payment);
  appointment.payments.push({ id: createId('pay'), ...payment, paidAt: new Date().toISOString() });
}

function nextToken(db: Database, date: ISODate): number {
  return db.appointments.filter((a) => a.date === date).reduce((max, a) => Math.max(max, a.token), 0) + 1;
}

/** Wraps a single-appointment mutation and returns the updated, joined record. */
function mutate(id: ID, change: (appointment: Appointment, db: Database) => void): Promise<AppointmentDetails> {
  return request(() =>
    writeDb((db) => {
      const appointment = findAppointment(db, id);
      change(appointment, db);
      return withDetails(db, appointment);
    }),
  );
}

export const appointmentService = {
  list({ date, doctorId }: AppointmentFilters): Promise<AppointmentDetails[]> {
    return request(() => {
      const db = readDb();
      return db.appointments
        .filter((a) => a.date === date && (!doctorId || a.doctorId === doctorId))
        .sort((a, b) => a.token - b.token)
        .map((a) => withDetails(db, a));
    });
  },

  get(id: ID): Promise<AppointmentDetails> {
    return request(() => {
      const db = readDb();
      return withDetails(db, findAppointment(db, id));
    });
  },

  book(input: BookAppointmentInput): Promise<AppointmentDetails> {
    return request(() =>
      writeDb((db) => {
        const today = todayISO();
        const doctor = db.doctors.find((d) => d.id === input.doctorId);
        if (!doctor) throw new ApiError('Please choose a doctor.', 'VALIDATION');
        if (!db.patients.some((p) => p.id === input.patientId)) {
          throw new ApiError('Please choose a patient.', 'VALIDATION');
        }
        if (input.date < today) throw new ApiError('Appointments cannot be booked in the past.', 'VALIDATION');

        const duplicate = db.appointments.find(
          (a) =>
            a.patientId === input.patientId &&
            a.doctorId === input.doctorId &&
            a.date === input.date &&
            ACTIVE_STATUSES.includes(a.status),
        );
        if (duplicate) {
          throw new ApiError(`This patient already has token #${duplicate.token} with ${doctor.name} that day.`, 'CONFLICT');
        }

        const now = new Date().toISOString();
        const checkIn = input.checkInNow && input.date === today;
        const appointment: Appointment = {
          id: createId('apt'),
          patientId: input.patientId,
          doctorId: input.doctorId,
          date: input.date,
          time: input.time || null,
          token: nextToken(db, input.date),
          reason: input.reason.trim(),
          status: checkIn ? 'waiting' : 'scheduled',
          fee: doctor.consultationFee,
          payments: [],
          prescription: null,
          followUpDate: null,
          createdAt: now,
          checkedInAt: checkIn ? now : null,
          startedAt: null,
          completedAt: null,
          cancelledAt: null,
        };
        db.appointments.push(appointment);
        return withDetails(db, appointment);
      }),
    );
  },

  checkIn(id: ID): Promise<AppointmentDetails> {
    return mutate(id, (appointment) => {
      assertStatus(appointment, ['scheduled'], 'check in');
      if (appointment.date !== todayISO()) {
        throw new ApiError('Only today’s appointments can be checked in.', 'CONFLICT');
      }
      appointment.status = 'waiting';
      appointment.checkedInAt = new Date().toISOString();
    });
  },

  startConsultation(id: ID): Promise<AppointmentDetails> {
    return mutate(id, (appointment, db) => {
      assertStatus(appointment, ['waiting'], 'start consultation');
      const busy = db.appointments.find(
        (a) => a.doctorId === appointment.doctorId && a.date === appointment.date && a.status === 'in_consultation',
      );
      if (busy) {
        throw new ApiError('This doctor is still in another consultation. Complete it first.', 'CONFLICT');
      }
      appointment.status = 'in_consultation';
      appointment.startedAt = new Date().toISOString();
    });
  },

  complete(id: ID, input: CompleteConsultationInput): Promise<AppointmentDetails> {
    return mutate(id, (appointment) => {
      assertStatus(appointment, ['in_consultation'], 'complete consultation');
      if (!input.prescription.diagnosis.trim()) {
        throw new ApiError('Please add a diagnosis to the prescription.', 'VALIDATION');
      }
      if (!(input.fee >= 0)) throw new ApiError('Fee cannot be negative.', 'VALIDATION');
      if (input.followUpDate && input.followUpDate <= appointment.date) {
        throw new ApiError('Follow-up date must be after the visit.', 'VALIDATION');
      }

      appointment.prescription = {
        diagnosis: input.prescription.diagnosis.trim(),
        advice: input.prescription.advice.trim(),
        medications: input.prescription.medications.filter((m) => m.name.trim()),
      };
      appointment.fee = input.fee;
      appointment.followUpDate = input.followUpDate;
      if (input.payment && input.payment.amount > 0) addPayment(appointment, input.payment);
      appointment.status = 'completed';
      appointment.completedAt = new Date().toISOString();
    });
  },

  cancel(id: ID): Promise<AppointmentDetails> {
    return mutate(id, (appointment) => {
      assertStatus(appointment, ['scheduled', 'waiting'], 'cancel');
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date().toISOString();
    });
  },

  recordPayment(id: ID, payment: PaymentInput): Promise<AppointmentDetails> {
    return mutate(id, (appointment) => {
      assertStatus(appointment, ['completed'], 'record payment');
      addPayment(appointment, payment);
    });
  },
};

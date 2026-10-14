import type { Appointment, AppointmentDetails, ID } from '../types/domain';
import type { Database } from './db';
import { ApiError } from './errors';

/** Server-side helpers shared by the mock services (the equivalent of DB joins). */

export function findAppointment(db: Database, id: ID): Appointment {
  const appointment = db.appointments.find((a) => a.id === id);
  if (!appointment) throw new ApiError('Appointment not found.', 'NOT_FOUND');
  return appointment;
}

export function withDetails(db: Database, appointment: Appointment): AppointmentDetails {
  const patient = db.patients.find((p) => p.id === appointment.patientId);
  const doctor = db.doctors.find((d) => d.id === appointment.doctorId);
  if (!patient || !doctor) {
    throw new ApiError('Appointment references a missing patient or doctor.', 'NOT_FOUND');
  }
  return { ...appointment, patient, doctor };
}

export const newestFirst = (a: Appointment, b: Appointment) =>
  a.date === b.date ? b.token - a.token : a.date < b.date ? 1 : -1;

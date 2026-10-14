import type { Appointment, Doctor, ID } from '../types/domain';
import { minutesSince } from './date';

const DEFAULT_CONSULTATION_MINUTES = 15;

export interface QueueEstimate {
  /** 1-based position in the doctor's waiting line. */
  position: number;
  /** Estimated minutes until the consultation starts. */
  waitMinutes: number;
}

type QueueEntry = Pick<Appointment, 'id' | 'doctorId' | 'status' | 'token' | 'checkedInAt' | 'startedAt'>;

/** Waiting order: first checked in, first seen; token breaks ties. */
export function compareByArrival(a: QueueEntry, b: QueueEntry): number {
  const arrivalA = a.checkedInAt ?? '';
  const arrivalB = b.checkedInAt ?? '';
  if (arrivalA !== arrivalB) return arrivalA < arrivalB ? -1 : 1;
  return a.token - b.token;
}

/** Scheduled order: by slot time, walk-ins (no slot) last, then token. */
export function compareBySlot(
  a: Pick<Appointment, 'time' | 'token'>,
  b: Pick<Appointment, 'time' | 'token'>,
): number {
  if (a.time !== b.time) {
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time < b.time ? -1 : 1;
  }
  return a.token - b.token;
}

/**
 * Estimates how long each waiting patient will wait, per doctor:
 * time left in the current consultation + one average consultation per patient ahead.
 */
export function estimateQueue(
  appointments: QueueEntry[],
  doctors: Pick<Doctor, 'id' | 'avgConsultationMinutes'>[],
  now: Date,
): Map<ID, QueueEstimate> {
  const averageByDoctor = new Map(doctors.map((d) => [d.id, d.avgConsultationMinutes]));
  const estimates = new Map<ID, QueueEstimate>();

  const doctorIds = new Set(appointments.map((a) => a.doctorId));
  for (const doctorId of doctorIds) {
    const average = averageByDoctor.get(doctorId) ?? DEFAULT_CONSULTATION_MINUTES;
    const forDoctor = appointments.filter((a) => a.doctorId === doctorId);

    const current = forDoctor.find((a) => a.status === 'in_consultation');
    const remaining = current?.startedAt
      ? Math.max(0, average - minutesSince(current.startedAt, now))
      : 0;

    forDoctor
      .filter((a) => a.status === 'waiting')
      .sort(compareByArrival)
      .forEach((appointment, index) => {
        estimates.set(appointment.id, {
          position: index + 1,
          waitMinutes: Math.round(remaining + index * average),
        });
      });
  }

  return estimates;
}

/** Estimated wait for a patient who joins `doctor`'s queue right now. */
export function estimateWaitForNewArrival(
  appointments: QueueEntry[],
  doctor: Pick<Doctor, 'id' | 'avgConsultationMinutes'>,
  now: Date,
): number {
  const newcomer: QueueEntry = {
    id: '__newcomer__',
    doctorId: doctor.id,
    status: 'waiting',
    token: Number.MAX_SAFE_INTEGER,
    checkedInAt: now.toISOString(),
    startedAt: null,
  };
  const estimates = estimateQueue([...appointments, newcomer], [doctor], now);
  return estimates.get(newcomer.id)?.waitMinutes ?? 0;
}

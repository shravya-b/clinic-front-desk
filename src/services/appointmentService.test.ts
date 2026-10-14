import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../config';
import { balanceDue, paymentStatus } from '../lib/billing';
import { todayISO } from '../lib/date';
import type { AppointmentDetails } from '../types/domain';
import { appointmentService } from './appointmentService';
import { resetDb } from './db';
import { ApiError } from './errors';
import { patientService } from './patientService';

const RAO = 'doc_rao';

async function today(): Promise<AppointmentDetails[]> {
  return appointmentService.list({ date: todayISO() });
}

async function findToday(predicate: (a: AppointmentDetails) => boolean): Promise<AppointmentDetails> {
  const match = (await today()).find(predicate);
  if (!match) throw new Error('Seed data is missing the expected appointment');
  return match;
}

const rejectsWith = (code: ApiError['code']) => expect.objectContaining({ name: 'ApiError', code });

beforeEach(() => {
  resetDb();
});

describe('appointmentService.book', () => {
  it('adds a walk-in straight to today’s queue with the next token', async () => {
    const patient = await patientService.create({
      name: 'Test Patient',
      phone: '9000000001',
      gender: 'female',
      dateOfBirth: null,
      email: '',
      address: '',
      allergies: '',
    });
    const maxToken = Math.max(...(await today()).map((a) => a.token));

    const booked = await appointmentService.book({
      patientId: patient.id,
      doctorId: RAO,
      date: todayISO(),
      time: null,
      reason: 'Fever',
      checkInNow: true,
    });

    expect(booked.status).toBe('waiting');
    expect(booked.checkedInAt).not.toBeNull();
    expect(booked.token).toBe(maxToken + 1);
  });

  it('rejects a second active booking with the same doctor on the same day', async () => {
    const waiting = await findToday((a) => a.doctorId === RAO && a.status === 'waiting');

    await expect(
      appointmentService.book({
        patientId: waiting.patientId,
        doctorId: RAO,
        date: todayISO(),
        time: null,
        reason: '',
        checkInNow: true,
      }),
    ).rejects.toEqual(rejectsWith('CONFLICT'));
  });
});

describe('consultation workflow', () => {
  it('allows only one consultation per doctor at a time', async () => {
    const next = await findToday((a) => a.doctorId === RAO && a.status === 'waiting');
    await expect(appointmentService.startConsultation(next.id)).rejects.toEqual(rejectsWith('CONFLICT'));
  });

  it('completes a visit with a partial payment, leaving a balance that can be settled later', async () => {
    const current = await findToday((a) => a.doctorId === RAO && a.status === 'in_consultation');

    const completed = await appointmentService.complete(current.id, {
      prescription: { diagnosis: 'Sprain', medications: [], advice: '' },
      fee: 500,
      payment: { amount: 200, method: 'cash' },
      followUpDate: null,
    });
    expect(completed.status).toBe('completed');
    expect(paymentStatus(completed)).toBe('partial');
    expect(balanceDue(completed)).toBe(300);

    await expect(
      appointmentService.recordPayment(current.id, { amount: 301, method: 'upi' }),
    ).rejects.toEqual(rejectsWith('VALIDATION'));

    const settled = await appointmentService.recordPayment(current.id, { amount: 300, method: 'upi' });
    expect(paymentStatus(settled)).toBe('paid');

    // The doctor is free again, so the next patient can be called in.
    const next = await findToday((a) => a.doctorId === RAO && a.status === 'waiting');
    await expect(appointmentService.startConsultation(next.id)).resolves.toMatchObject({ status: 'in_consultation' });
  });

  it('leaves data untouched when a write is rejected', async () => {
    const current = await findToday((a) => a.status === 'in_consultation');
    const before = localStorage.getItem(STORAGE_KEYS.database);

    await expect(
      appointmentService.complete(current.id, {
        prescription: { diagnosis: '  ', medications: [], advice: '' },
        fee: 500,
        payment: null,
        followUpDate: null,
      }),
    ).rejects.toEqual(rejectsWith('VALIDATION'));

    expect(localStorage.getItem(STORAGE_KEYS.database)).toBe(before);
    expect((await appointmentService.get(current.id)).status).toBe('in_consultation');
  });

  it('only lets scheduled or waiting appointments be cancelled', async () => {
    const completed = await findToday((a) => a.status === 'completed');
    await expect(appointmentService.cancel(completed.id)).rejects.toEqual(rejectsWith('CONFLICT'));

    const scheduled = await findToday((a) => a.status === 'scheduled');
    await expect(appointmentService.cancel(scheduled.id)).resolves.toMatchObject({ status: 'cancelled' });
  });
});

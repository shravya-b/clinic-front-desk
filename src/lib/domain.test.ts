import { describe, expect, it } from 'vitest';
import { balanceDue, hasOutstandingBalance, paymentStatus, totalsByMethod } from './billing';
import { addDays, ageInYears } from './date';
import { compareBySlot, estimateQueue, estimateWaitForNewArrival } from './queue';
import { validatePatient } from './validation';

const NOW = new Date('2026-10-14T11:00:00');
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

describe('estimateQueue', () => {
  const doctors = [
    { id: 'a', avgConsultationMinutes: 10 },
    { id: 'b', avgConsultationMinutes: 20 },
  ];

  it('adds the remaining consultation time plus one slot per patient ahead', () => {
    const estimates = estimateQueue(
      [
        { id: 'current', doctorId: 'a', status: 'in_consultation', token: 1, checkedInAt: minutesAgo(30), startedAt: minutesAgo(4) },
        { id: 'second', doctorId: 'a', status: 'waiting', token: 3, checkedInAt: minutesAgo(5), startedAt: null },
        { id: 'first', doctorId: 'a', status: 'waiting', token: 2, checkedInAt: minutesAgo(20), startedAt: null },
      ],
      doctors,
      NOW,
    );
    expect(estimates.get('first')).toEqual({ position: 1, waitMinutes: 6 });
    expect(estimates.get('second')).toEqual({ position: 2, waitMinutes: 16 });
    expect(estimates.has('current')).toBe(false);
  });

  it('keeps separate queues per doctor and never goes negative on overrun', () => {
    const estimates = estimateQueue(
      [
        { id: 'overrun', doctorId: 'b', status: 'in_consultation', token: 1, checkedInAt: minutesAgo(60), startedAt: minutesAgo(45) },
        { id: 'b1', doctorId: 'b', status: 'waiting', token: 2, checkedInAt: minutesAgo(10), startedAt: null },
        { id: 'a1', doctorId: 'a', status: 'waiting', token: 3, checkedInAt: minutesAgo(2), startedAt: null },
      ],
      doctors,
      NOW,
    );
    expect(estimates.get('b1')).toEqual({ position: 1, waitMinutes: 0 });
    expect(estimates.get('a1')).toEqual({ position: 1, waitMinutes: 0 });
  });
});

describe('compareBySlot', () => {
  it('orders by time with walk-ins last', () => {
    const rows = [
      { time: null, token: 1 },
      { time: '15:00', token: 2 },
      { time: '09:30', token: 3 },
    ];
    expect(rows.sort(compareBySlot).map((r) => r.token)).toEqual([3, 2, 1]);
  });
});

describe('billing', () => {
  const pay = (amount: number) => ({ id: String(amount), amount, method: 'cash' as const, paidAt: NOW.toISOString() });

  it('derives payment status and balance', () => {
    expect(paymentStatus({ fee: 500, payments: [] })).toBe('unpaid');
    expect(paymentStatus({ fee: 500, payments: [pay(200)] })).toBe('partial');
    expect(paymentStatus({ fee: 500, payments: [pay(200), pay(300)] })).toBe('paid');
    expect(balanceDue({ fee: 500, payments: [pay(200)] })).toBe(300);
  });

  it('only bills completed visits', () => {
    expect(hasOutstandingBalance({ status: 'waiting', fee: 500, payments: [] })).toBe(false);
    expect(hasOutstandingBalance({ status: 'completed', fee: 500, payments: [] })).toBe(true);
  });
});

describe('dates', () => {
  it('adds days across month boundaries in local time', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('computes age with birthday not yet reached', () => {
    expect(ageInYears('1990-12-01', NOW)).toBe(35);
    expect(ageInYears('1990-10-14', NOW)).toBe(36);
    expect(ageInYears(null, NOW)).toBeNull();
  });
});

describe('validatePatient', () => {
  const valid = {
    name: 'Asha Rao',
    phone: '98765 43210',
    gender: 'female' as const,
    dateOfBirth: null,
    email: '',
    address: '',
    allergies: '',
  };

  it('accepts a minimal valid patient', () => {
    expect(validatePatient(valid, '2026-10-14')).toEqual({});
  });

  it('flags missing name, bad phone, bad email and future DOB', () => {
    const errors = validatePatient(
      { ...valid, name: ' ', phone: '123', email: 'nope', dateOfBirth: '2030-01-01' },
      '2026-10-14',
    );
    expect(Object.keys(errors).sort()).toEqual(['dateOfBirth', 'email', 'name', 'phone']);
  });
});

describe('estimateWaitForNewArrival', () => {
  const doctor = { id: 'a', avgConsultationMinutes: 10 };

  it('is zero when the doctor is free', () => {
    expect(estimateWaitForNewArrival([], doctor, NOW)).toBe(0);
  });

  it('includes the current consultation and everyone already waiting', () => {
    const queue = [
      { id: 'c', doctorId: 'a', status: 'in_consultation' as const, token: 1, checkedInAt: minutesAgo(20), startedAt: minutesAgo(3) },
      { id: 'w', doctorId: 'a', status: 'waiting' as const, token: 2, checkedInAt: minutesAgo(10), startedAt: null },
    ];
    expect(estimateWaitForNewArrival(queue, doctor, NOW)).toBe(17);
  });
});

describe('totalsByMethod', () => {
  it('totals each method in a fixed order, including methods with no payments', () => {
    const totals = totalsByMethod([
      { amount: 500, method: 'upi' },
      { amount: 200, method: 'cash' },
      { amount: 300, method: 'upi' },
    ]);
    expect(totals).toEqual([
      { method: 'cash', amount: 200, count: 1 },
      { method: 'upi', amount: 800, count: 2 },
      { method: 'card', amount: 0, count: 0 },
    ]);
  });
});

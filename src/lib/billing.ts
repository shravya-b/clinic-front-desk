import type { Appointment, Payment, PaymentMethod, PaymentStatus } from '../types/domain';

type Billable = Pick<Appointment, 'fee' | 'payments'>;

export function amountPaid(appointment: Pick<Appointment, 'payments'>): number {
  return appointment.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export function balanceDue(appointment: Billable): number {
  return Math.max(0, appointment.fee - amountPaid(appointment));
}

export function paymentStatus(appointment: Billable): PaymentStatus {
  const paid = amountPaid(appointment);
  if (paid >= appointment.fee) return 'paid';
  return paid > 0 ? 'partial' : 'unpaid';
}

/** Only completed visits are billed; earlier stages have nothing outstanding yet. */
export function hasOutstandingBalance(appointment: Billable & Pick<Appointment, 'status'>): boolean {
  return appointment.status === 'completed' && balanceDue(appointment) > 0;
}

export interface MethodTotal {
  method: PaymentMethod;
  amount: number;
  count: number;
}

/** Fixed display order, so a method keeps its colour whether or not others are present. */
export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'upi', 'card'];

/** Totals per payment method, always in `PAYMENT_METHODS` order (zero rows included). */
export function totalsByMethod(payments: Array<Pick<Payment, 'amount' | 'method'>>): MethodTotal[] {
  return PAYMENT_METHODS.map((method) => {
    const matching = payments.filter((p) => p.method === method);
    return { method, amount: matching.reduce((sum, p) => sum + p.amount, 0), count: matching.length };
  });
}

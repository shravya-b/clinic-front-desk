import { balanceDue, hasOutstandingBalance } from '../lib/billing';
import { dateOfTimestamp } from '../lib/date';
import type { Appointment, AppointmentDetails, Doctor, ID, ISODate, ISODateTime, PaymentMethod } from '../types/domain';
import { readDb } from './db';
import { request } from './request';
import { newestFirst, withDetails } from './selectors';

export interface DashboardStats {
  booked: number;
  waiting: number;
  inConsultation: number;
  completed: number;
  cancelled: number;
  /** Payments received on the date, for any visit. */
  collected: number;
  /** Unpaid balance of visits on the date. */
  outstanding: number;
}

export interface DoctorActivity {
  doctor: Doctor;
  current: AppointmentDetails | null;
  waiting: number;
  completed: number;
}

export interface Transaction {
  id: ID;
  appointment: AppointmentDetails;
  amount: number;
  method: PaymentMethod;
  paidAt: ISODateTime;
}

export interface FollowUp {
  appointment: AppointmentDetails;
  /** The patient already has an active booking on the follow-up date. */
  isBooked: boolean;
}

export interface DashboardSummary {
  date: ISODate;
  stats: DashboardStats;
  doctors: DoctorActivity[];
  transactions: Transaction[];
  pendingForDate: AppointmentDetails[];
  pendingAllDates: AppointmentDetails[];
  followUps: FollowUp[];
}

export const dashboardService = {
  getSummary(date: ISODate): Promise<DashboardSummary> {
    return request(() => {
      const db = readDb();
      const details = (a: Appointment) => withDetails(db, a);
      const ofDay = db.appointments.filter((a) => a.date === date);
      const countBy = (status: AppointmentDetails['status']) => ofDay.filter((a) => a.status === status).length;

      const transactions: Transaction[] = db.appointments
        .flatMap((a) =>
          a.payments
            .filter((p) => dateOfTimestamp(p.paidAt) === date)
            .map((p) => ({ id: p.id, amount: p.amount, method: p.method, paidAt: p.paidAt, appointment: details(a) })),
        )
        .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));

      const pendingAllDates = db.appointments.filter(hasOutstandingBalance).sort(newestFirst).map(details);

      const followUps: FollowUp[] = db.appointments
        .filter((a) => a.followUpDate === date)
        .map((a) => ({
          appointment: details(a),
          isBooked: ofDay.some(
            (other) => other.patientId === a.patientId && other.id !== a.id && other.status !== 'cancelled',
          ),
        }));

      return {
        date,
        stats: {
          booked: ofDay.filter((a) => a.status !== 'cancelled').length,
          waiting: countBy('waiting'),
          inConsultation: countBy('in_consultation'),
          completed: countBy('completed'),
          cancelled: countBy('cancelled'),
          collected: transactions.reduce((sum, t) => sum + t.amount, 0),
          outstanding: ofDay.filter(hasOutstandingBalance).reduce((sum, a) => sum + balanceDue(a), 0),
        },
        doctors: db.doctors.map((doctor) => {
          const mine = ofDay.filter((a) => a.doctorId === doctor.id);
          const current = mine.find((a) => a.status === 'in_consultation');
          return {
            doctor,
            current: current ? details(current) : null,
            waiting: mine.filter((a) => a.status === 'waiting').length,
            completed: mine.filter((a) => a.status === 'completed').length,
          };
        }),
        transactions,
        pendingForDate: pendingAllDates.filter((a) => a.date === date),
        pendingAllDates,
        followUps,
      };
    });
  },
};

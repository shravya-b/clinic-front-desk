import { addDays, toISODate } from '../lib/date';
import type {
  Appointment,
  AppointmentStatus,
  Doctor,
  ISODate,
  ISODateTime,
  Medication,
  Patient,
  PaymentMethod,
} from '../types/domain';
import type { Database } from './db';

const DOCTORS: Doctor[] = [
  { id: 'doc_rao', name: 'Dr. Ananya Rao', specialty: 'General Physician', consultationFee: 500, avgConsultationMinutes: 12 },
  { id: 'doc_mehta', name: 'Dr. Vikram Mehta', specialty: 'Pediatrics', consultationFee: 600, avgConsultationMinutes: 15 },
  { id: 'doc_thomas', name: 'Dr. Sara Thomas', specialty: 'Dermatology', consultationFee: 800, avgConsultationMinutes: 20 },
];

type SeedPatient = Omit<Patient, 'createdAt' | 'email' | 'address' | 'allergies'> &
  Partial<Pick<Patient, 'email' | 'address' | 'allergies'>>;

const PATIENTS: SeedPatient[] = [
  { id: 'pat_01', name: 'Priya Sharma', phone: '9876543210', gender: 'female', dateOfBirth: '1991-04-12', email: 'priya.sharma@example.com', allergies: 'Penicillin' },
  { id: 'pat_02', name: 'Rahul Verma', phone: '9812345678', gender: 'male', dateOfBirth: '1985-09-30', address: '14 Lake View Road' },
  { id: 'pat_03', name: 'Meera Iyer', phone: '9845012345', gender: 'female', dateOfBirth: '1968-01-22' },
  { id: 'pat_04', name: 'Arjun Nair', phone: '9900112233', gender: 'male', dateOfBirth: '2016-06-05', address: '3rd Cross, Indiranagar' },
  { id: 'pat_05', name: 'Fatima Khan', phone: '9988776655', gender: 'female', dateOfBirth: '1994-11-18', email: 'fatima.k@example.com' },
  { id: 'pat_06', name: 'Suresh Patel', phone: '9123456780', gender: 'male', dateOfBirth: '1959-03-08', allergies: 'Sulfa drugs' },
  { id: 'pat_07', name: 'Kavya Reddy', phone: '9090909090', gender: 'female', dateOfBirth: '2019-12-01' },
  { id: 'pat_08', name: 'Joseph D’Souza', phone: '9567890123', gender: 'male', dateOfBirth: '1978-07-14' },
  { id: 'pat_09', name: 'Ananya Ghosh', phone: '9345678901', gender: 'female', dateOfBirth: '2012-02-27' },
  { id: 'pat_10', name: 'Imran Sheikh', phone: '9234567890', gender: 'male', dateOfBirth: '1989-05-03' },
  { id: 'pat_11', name: 'Lakshmi Menon', phone: '9445566778', gender: 'female', dateOfBirth: '1972-10-09', allergies: 'Latex' },
  { id: 'pat_12', name: 'Rohan Gupta', phone: '9556677889', gender: 'male', dateOfBirth: '2001-08-21', email: 'rohan.g@example.com' },
  { id: 'pat_13', name: 'Neha Joshi', phone: '9667788990', gender: 'female', dateOfBirth: '1997-04-30' },
  { id: 'pat_14', name: 'Daniel Fernandes', phone: '9778899001', gender: 'male', dateOfBirth: '1964-12-17' },
  { id: 'pat_15', name: 'Sneha Kulkarni', phone: '9889900112', gender: 'female', dateOfBirth: '1983-06-25' },
  { id: 'pat_16', name: 'Vivek Choudhary', phone: '9001122334', gender: 'male', dateOfBirth: '1992-09-11' },
];

const SAMPLE_PRESCRIPTIONS: Array<{ diagnosis: string; medications: Medication[]; advice: string }> = [
  {
    diagnosis: 'Viral upper respiratory infection',
    medications: [
      { name: 'Paracetamol 500 mg', dosage: '1 tablet', frequency: 'Three times a day', duration: '3 days' },
      { name: 'Cetirizine 10 mg', dosage: '1 tablet', frequency: 'At night', duration: '5 days' },
    ],
    advice: 'Warm fluids, rest. Return if fever persists beyond 3 days.',
  },
  {
    diagnosis: 'Atopic dermatitis',
    medications: [
      { name: 'Hydrocortisone 1% cream', dosage: 'Thin layer', frequency: 'Twice a day', duration: '7 days' },
      { name: 'Moisturising lotion', dosage: 'Apply liberally', frequency: 'Three times a day', duration: '30 days' },
    ],
    advice: 'Avoid hot showers and scented soaps.',
  },
  {
    diagnosis: 'Hypertension – routine review',
    medications: [{ name: 'Amlodipine 5 mg', dosage: '1 tablet', frequency: 'Once a day', duration: '30 days' }],
    advice: 'Reduce salt intake. Monitor BP at home.',
  },
  {
    diagnosis: 'Acute gastroenteritis',
    medications: [
      { name: 'ORS sachet', dosage: '1 sachet in 1 L water', frequency: 'As needed', duration: '3 days' },
      { name: 'Ondansetron 4 mg', dosage: '1 tablet', frequency: 'Twice a day', duration: '2 days' },
    ],
    advice: 'Light diet, plenty of fluids.',
  },
];

interface SeedVisit {
  patient: number;
  doctor: number;
  /** Day offset from today. */
  day: number;
  status: AppointmentStatus;
  reason: string;
  time?: string;
  /** For today's visits: minutes before "now"; for other days: clock time `HH:mm`. */
  checkedIn?: number | string;
  started?: number | string;
  completed?: number | string;
  payments?: Array<{ amount: number; method: PaymentMethod; daysLater?: number }>;
  prescription?: number;
  followUpInDays?: number;
}

/** Visits are listed in arrival order per day, which determines token numbers. */
const VISITS: SeedVisit[] = [
  // ---- Past ----
  { patient: 15, doctor: 0, day: -10, status: 'completed', reason: 'Fever and cough', checkedIn: '10:05', started: '10:20', completed: '10:32', prescription: 0, payments: [{ amount: 300, method: 'cash' }], followUpInDays: 11 },
  { patient: 14, doctor: 1, day: -7, status: 'completed', reason: 'Child vaccination query', checkedIn: '11:00', started: '11:10', completed: '11:25', prescription: 0, payments: [{ amount: 600, method: 'upi' }], followUpInDays: 7 },
  { patient: 9, doctor: 0, day: -6, status: 'completed', reason: 'BP check', checkedIn: '09:40', started: '09:50', completed: '10:02', prescription: 2, payments: [{ amount: 500, method: 'card' }], followUpInDays: 6 },
  { patient: 0, doctor: 2, day: -3, status: 'completed', reason: 'Skin rash', checkedIn: '16:10', started: '16:30', completed: '16:50', prescription: 1, payments: [{ amount: 400, method: 'cash' }, { amount: 200, method: 'upi', daysLater: 3 }] },
  { patient: 13, doctor: 1, day: -2, status: 'completed', reason: 'Stomach ache', checkedIn: '12:00', started: '12:15', completed: '12:30', prescription: 3 },
  { patient: 5, doctor: 0, day: -2, status: 'completed', reason: 'Diabetes review', checkedIn: '12:20', started: '12:35', completed: '12:50', prescription: 2, payments: [{ amount: 500, method: 'cash' }], followUpInDays: 9 },
  { patient: 11, doctor: 0, day: -1, status: 'completed', reason: 'Headache', checkedIn: '10:30', started: '10:40', completed: '10:55', prescription: 0, payments: [{ amount: 500, method: 'upi' }] },
  { patient: 4, doctor: 2, day: -1, status: 'completed', reason: 'Acne follow-up', checkedIn: '17:00', started: '17:15', completed: '17:40', prescription: 1, payments: [{ amount: 500, method: 'card' }], followUpInDays: 1 },
  { patient: 7, doctor: 1, day: -1, status: 'cancelled', reason: 'Ear pain', time: '11:30' },

  // ---- Today (times are minutes before now) ----
  { patient: 0, doctor: 0, day: 0, status: 'completed', reason: 'Follow-up: skin rash', checkedIn: 95, started: 80, completed: 68, prescription: 1, payments: [{ amount: 500, method: 'cash' }] },
  { patient: 1, doctor: 0, day: 0, status: 'completed', reason: 'Back pain', checkedIn: 85, started: 66, completed: 52, prescription: 0, payments: [{ amount: 300, method: 'upi' }], followUpInDays: 14 },
  { patient: 6, doctor: 1, day: 0, status: 'completed', reason: 'Fever', checkedIn: 75, started: 60, completed: 44, prescription: 0 },
  { patient: 2, doctor: 0, day: 0, status: 'in_consultation', reason: 'Joint pain', checkedIn: 70, started: 6 },
  { patient: 10, doctor: 2, day: 0, status: 'in_consultation', reason: 'Eczema flare-up', checkedIn: 50, started: 15 },
  { patient: 3, doctor: 0, day: 0, status: 'waiting', reason: 'Cold and cough', checkedIn: 40 },
  { patient: 8, doctor: 1, day: 0, status: 'waiting', reason: 'Growth check', checkedIn: 30 },
  { patient: 4, doctor: 0, day: 0, status: 'waiting', reason: 'Dizziness', checkedIn: 22 },
  { patient: 11, doctor: 2, day: 0, status: 'waiting', reason: 'Hair loss', checkedIn: 18 },
  { patient: 9, doctor: 1, day: 0, status: 'waiting', reason: 'Follow-up: BP', checkedIn: 12 },
  { patient: 5, doctor: 0, day: 0, status: 'waiting', reason: 'Lab report review', checkedIn: 5 },
  { patient: 13, doctor: 2, day: 0, status: 'cancelled', reason: 'Mole check', time: '12:00' },
  { patient: 7, doctor: 0, day: 0, status: 'scheduled', reason: 'Ear pain', time: '17:30' },
  { patient: 12, doctor: 2, day: 0, status: 'scheduled', reason: 'Skin allergy', time: '18:00' },

  // ---- Upcoming ----
  { patient: 15, doctor: 0, day: 1, status: 'scheduled', reason: 'Follow-up: fever', time: '10:30' },
  { patient: 3, doctor: 1, day: 1, status: 'scheduled', reason: 'Vaccination', time: '11:00' },
  { patient: 8, doctor: 2, day: 2, status: 'scheduled', reason: 'Skin check', time: '16:30' },
];

export function createSeedData(now: Date): Database {
  const today = toISODate(now);

  const timestamp = (date: ISODate, value: number | string): ISODateTime =>
    typeof value === 'number'
      ? new Date(now.getTime() - value * 60_000).toISOString()
      : new Date(`${date}T${value}:00`).toISOString();

  // A balance settled on a later day; if that day is today, keep it in the past.
  const laterPaymentTime = (date: ISODate) => (date === today ? timestamp(date, 30) : timestamp(date, '11:15'));

  const patients: Patient[] = PATIENTS.map((patient, index) => ({
    email: '',
    address: '',
    allergies: '',
    ...patient,
    createdAt: timestamp(addDays(today, -(120 - index * 5)), '09:00'),
  }));

  const tokensByDate = new Map<ISODate, number>();
  let paymentCount = 0;

  const appointments: Appointment[] = VISITS.map((visit, index) => {
    const date = addDays(today, visit.day);
    const doctor = DOCTORS[visit.doctor];
    const token = (tokensByDate.get(date) ?? 0) + 1;
    tokensByDate.set(date, token);

    const at = (value: number | string | undefined) => (value === undefined ? null : timestamp(date, value));
    const completedAt = at(visit.completed);
    const prescription = visit.prescription === undefined ? null : SAMPLE_PRESCRIPTIONS[visit.prescription];

    return {
      id: `apt_${String(index + 1).padStart(3, '0')}`,
      patientId: patients[visit.patient].id,
      doctorId: doctor.id,
      date,
      time: visit.time ?? null,
      token,
      reason: visit.reason,
      status: visit.status,
      fee: doctor.consultationFee,
      payments: (visit.payments ?? []).map((payment) => ({
        id: `pay_${String(++paymentCount).padStart(3, '0')}`,
        amount: payment.amount,
        method: payment.method,
        paidAt: payment.daysLater
          ? laterPaymentTime(addDays(date, payment.daysLater))
          : (completedAt ?? timestamp(date, '12:00')),
      })),
      prescription,
      followUpDate: visit.followUpInDays ? addDays(date, visit.followUpInDays) : null,
      createdAt: timestamp(addDays(date, visit.day > 0 ? -2 : 0), '08:30'),
      checkedInAt: at(visit.checkedIn),
      startedAt: at(visit.started),
      completedAt,
      cancelledAt: visit.status === 'cancelled' ? timestamp(date, '08:45') : null,
    };
  });

  return { doctors: DOCTORS, patients, appointments };
}

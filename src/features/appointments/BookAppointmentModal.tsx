import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Checkbox, Field, TextInput } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { ErrorState, InlineError, LoadingState } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import { useDoctors } from '../../hooks/useDoctors';
import { useMutation } from '../../hooks/useMutation';
import { useQuery } from '../../hooks/useQuery';
import { todayISO } from '../../lib/date';
import { formatMinutes, formatRelativeDay } from '../../lib/format';
import { estimateWaitForNewArrival } from '../../lib/queue';
import { hasErrors, phoneDigits } from '../../lib/validation';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';
import type { AppointmentDetails, Doctor, ID, ISODate, Patient, PatientInput } from '../../types/domain';
import { EMPTY_PATIENT, PatientForm } from '../patients/PatientForm';
import { PatientPicker } from '../patients/PatientPicker';
import { DoctorPicker } from './DoctorPicker';

interface BookAppointmentModalProps {
  initialPatient?: Patient | null;
  initialDoctorId?: ID | null;
  initialDate?: ISODate;
  onClose: () => void;
  onBooked?: (appointment: AppointmentDetails) => void;
}

interface FormErrors {
  patient?: string;
  doctor?: string;
  date?: string;
}

const REGISTER_FORM_ID = 'book-register-patient';
const BOOK_FORM_ID = 'book-appointment-form';

/** Prefill the registration form from whatever the receptionist typed in search. */
function prefillFromSearch(search: string): PatientInput {
  const digits = phoneDigits(search);
  return digits.length >= 6 && digits.length === search.replace(/[\s+-]/g, '').length
    ? { ...EMPTY_PATIENT, phone: search }
    : { ...EMPTY_PATIENT, name: search };
}

/**
 * Two-step flow in one dialog: find (or register) the patient, then pick doctor and date.
 * Booking for today with "patient is here" checked puts them straight into the live queue.
 */
export function BookAppointmentModal({
  initialPatient = null,
  initialDoctorId = null,
  initialDate = todayISO(),
  onClose,
  onBooked,
}: BookAppointmentModalProps) {
  const toast = useToast();
  const today = todayISO();
  const doctorsQuery = useDoctors();

  const [patient, setPatient] = useState<Patient | null>(initialPatient);
  const [registerPrefill, setRegisterPrefill] = useState<PatientInput | null>(null);
  const [doctorId, setDoctorId] = useState<ID | null>(initialDoctorId);
  const [date, setDate] = useState<ISODate>(initialDate < today ? today : initialDate);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [checkInNow, setCheckInNow] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const isToday = date === today;
  const dayQuery = useQuery(`appointments:${date}`, () => appointmentService.list({ date }), { enabled: isToday });

  const registerMutation = useMutation(patientService.create);
  const bookMutation = useMutation(appointmentService.book);
  const isRegistering = registerPrefill !== null;
  const isPending = registerMutation.isPending || bookMutation.isPending;

  const queueNote = (doctor: Doctor): string | null => {
    if (!isToday || !dayQuery.data) return null;
    const waiting = dayQuery.data.filter((a) => a.doctorId === doctor.id && a.status === 'waiting').length;
    const wait = estimateWaitForNewArrival(dayQuery.data, doctor, new Date());
    if (wait === 0) return 'No wait right now';
    return `${waiting} waiting · ~${formatMinutes(wait)}`;
  };

  const handleRegister = async (values: PatientInput) => {
    const result = await registerMutation.mutate(values);
    if (result.ok) {
      toast.success(`${result.data.name} has been registered.`);
      setPatient(result.data);
      setRegisterPrefill(null);
      setErrors((e) => ({ ...e, patient: undefined }));
    }
  };

  const handleBook = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!patient) nextErrors.patient = 'Select or register a patient';
    if (!doctorId) nextErrors.doctor = 'Choose a doctor';
    if (!date || date < today) nextErrors.date = 'Choose today or a future date';
    setErrors(nextErrors);
    if (hasErrors(nextErrors) || !patient || !doctorId) return;

    const result = await bookMutation.mutate({
      patientId: patient.id,
      doctorId,
      date,
      time: time || null,
      reason,
      checkInNow: isToday && checkInNow,
    });
    if (result.ok) {
      const booked = result.data;
      toast.success(
        booked.status === 'waiting'
          ? `${booked.patient.name} added to today’s queue · token #${booked.token}.`
          : `Booked ${booked.patient.name} for ${formatRelativeDay(booked.date).toLowerCase()} · token #${booked.token}.`,
      );
      onBooked?.(booked);
      onClose();
    }
  };

  const footer = isRegistering ? (
    <>
      <Button onClick={() => setRegisterPrefill(null)} disabled={isPending}>
        Back
      </Button>
      <Button variant="primary" type="submit" form={REGISTER_FORM_ID} loading={registerMutation.isPending}>
        Register & continue
      </Button>
    </>
  ) : (
    <>
      <Button onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form={BOOK_FORM_ID} loading={bookMutation.isPending}>
        {isToday && checkInNow ? 'Book & add to queue' : 'Book appointment'}
      </Button>
    </>
  );

  return (
    <Modal
      title={isRegistering ? 'Register new patient' : 'Book appointment'}
      description={isRegistering ? 'They’ll be selected for this booking once registered.' : undefined}
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      footer={footer}
    >
      {isRegistering ? (
        <div className="stack">
          <PatientForm
            id={REGISTER_FORM_ID}
            initialValues={registerPrefill}
            disabled={registerMutation.isPending}
            onSubmit={handleRegister}
          />
          <InlineError error={registerMutation.error} />
        </div>
      ) : (
        <form id={BOOK_FORM_ID} className="stack" onSubmit={handleBook} noValidate>
          <div className="field">
            <span className="field__label">
              Patient <span className="field__required" aria-hidden="true">*</span>
            </span>
            <PatientPicker
              value={patient}
              onChange={(next) => {
                setPatient(next);
                if (next) setErrors((e) => ({ ...e, patient: undefined }));
              }}
              onRegisterNew={(search) => setRegisterPrefill(prefillFromSearch(search))}
              error={errors.patient}
            />
          </div>

          {doctorsQuery.data ? (
            <DoctorPicker
              doctors={doctorsQuery.data}
              value={doctorId}
              onChange={(id) => {
                setDoctorId(id);
                setErrors((e) => ({ ...e, doctor: undefined }));
              }}
              getNote={queueNote}
              error={errors.doctor}
            />
          ) : doctorsQuery.error ? (
            <ErrorState compact error={doctorsQuery.error} title="Couldn’t load doctors" onRetry={doctorsQuery.reload} />
          ) : (
            <LoadingState compact label="Loading doctors…" />
          )}

          <div className="form-grid">
            <Field label="Date" error={errors.date} required>
              {(control) => (
                <TextInput {...control} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
              )}
            </Field>
            <Field label="Preferred time" hint="Leave empty for walk-ins">
              {(control) => <TextInput {...control} type="time" value={time} onChange={(e) => setTime(e.target.value)} />}
            </Field>
            <Field label="Reason for visit" className="span-2">
              {(control) => (
                <TextInput
                  {...control}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Fever, follow-up, vaccination"
                />
              )}
            </Field>
          </div>

          {isToday && (
            <Checkbox
              label="Patient is at the clinic (add to today’s queue now)"
              description="Uncheck to book a later slot today; you can check them in when they arrive."
              checked={checkInNow}
              onChange={(e) => setCheckInNow(e.target.checked)}
            />
          )}

          <InlineError error={bookMutation.error} />
        </form>
      )}
    </Modal>
  );
}

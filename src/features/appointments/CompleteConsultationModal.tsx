import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, Textarea } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { InlineError } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import { useMutation } from '../../hooks/useMutation';
import { addDays } from '../../lib/date';
import { formatCurrency, formatDate } from '../../lib/format';
import { hasErrors } from '../../lib/validation';
import { appointmentService } from '../../services/appointmentService';
import type { AppointmentDetails, ISODate, Medication, PaymentMethod } from '../../types/domain';
import { PaymentMethodPicker } from '../billing/PaymentMethodPicker';
import { EMPTY_MEDICATION, MedicationEditor } from './MedicationEditor';
import './appointments.css';

const FOLLOW_UP_PRESETS = [
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
];

interface FormErrors {
  diagnosis?: string;
  fee?: string;
  amount?: string;
  followUpDate?: string;
}

interface CompleteConsultationModalProps {
  appointment: AppointmentDetails;
  onClose: () => void;
}

/** Checkout step: capture the doctor's prescription, collect payment and set a follow-up. */
export function CompleteConsultationModal({ appointment, onClose }: CompleteConsultationModalProps) {
  const toast = useToast();
  const { mutate, isPending, error } = useMutation(appointmentService.complete);

  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState<Medication[]>([EMPTY_MEDICATION]);
  const [advice, setAdvice] = useState('');
  const [fee, setFee] = useState(String(appointment.fee));
  const [amount, setAmount] = useState(String(appointment.fee));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [followUpDate, setFollowUpDate] = useState<ISODate | null>(null);
  /** Errors appear after the first submit attempt, then update live as fields are fixed. */
  const [showErrors, setShowErrors] = useState(false);

  const feeValue = Number(fee);
  const amountValue = amount.trim() === '' ? 0 : Number(amount);
  const balance = Number.isFinite(feeValue - amountValue) ? Math.max(0, feeValue - amountValue) : 0;
  const minFollowUp = addDays(appointment.date, 1);

  /** Keep "amount received" in step with the fee unless the receptionist has changed it. */
  const handleFeeChange = (value: string) => {
    if (amount === fee) setAmount(value);
    setFee(value);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!diagnosis.trim()) next.diagnosis = 'Diagnosis is required';
    if (fee.trim() === '' || !(feeValue >= 0)) next.fee = 'Enter a valid fee';
    if (!(amountValue >= 0)) next.amount = 'Enter a valid amount';
    else if (amountValue > feeValue) next.amount = 'Cannot exceed the fee';
    if (followUpDate && followUpDate < minFollowUp) next.followUpDate = 'Must be after today’s visit';
    return next;
  };

  const errors = showErrors ? validate() : {};

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (hasErrors(validate())) return;

    const result = await mutate(appointment.id, {
      prescription: { diagnosis, medications, advice },
      fee: feeValue,
      payment: amountValue > 0 ? { amount: amountValue, method } : null,
      followUpDate,
    });
    if (result.ok) {
      toast.success(`Consultation completed for ${appointment.patient.name}.`);
      onClose();
    }
  };

  return (
    <Modal
      title="Complete consultation"
      description={`${appointment.patient.name} · Token #${appointment.token} · ${appointment.doctor.name}`}
      size="lg"
      onClose={onClose}
      dismissible={!isPending}
      footer={
        <>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="complete-consultation-form" icon="check" loading={isPending}>
            Complete visit
          </Button>
        </>
      }
    >
      <form id="complete-consultation-form" className="checkout" onSubmit={handleSubmit} noValidate>
        <fieldset className="checkout__section" disabled={isPending}>
          <legend>Prescription</legend>
          <p className="text-subtle">Enter the prescription shared by the doctor.</p>
          {appointment.patient.allergies && (
            <p className="allergy-note">Allergies: {appointment.patient.allergies}</p>
          )}
          <Field label="Diagnosis" error={errors.diagnosis} required>
            {(control) => (
              <TextInput {...control} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} autoFocus />
            )}
          </Field>
          <div className="field">
            <span className="field__label">Medicines</span>
            <MedicationEditor value={medications} onChange={setMedications} />
          </div>
          <Field label="Advice / notes">
            {(control) => <Textarea {...control} rows={2} value={advice} onChange={(e) => setAdvice(e.target.value)} />}
          </Field>
        </fieldset>

        <fieldset className="checkout__section" disabled={isPending}>
          <legend>Payment</legend>
          <div className="form-grid">
            <Field label="Consultation fee" error={errors.fee} required>
              {(control) => (
                <TextInput {...control} type="number" inputMode="decimal" min={0} value={fee} onChange={(e) => handleFeeChange(e.target.value)} />
              )}
            </Field>
            <Field
              label="Amount received now"
              error={errors.amount}
              hint={balance > 0 ? `${formatCurrency(balance)} will be marked as pending` : 'Fully paid'}
            >
              {(control) => (
                <TextInput {...control} type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              )}
            </Field>
          </div>
          {amountValue > 0 && (
            <div className="field">
              <span className="field__label">Payment method</span>
              <PaymentMethodPicker value={method} onChange={setMethod} />
            </div>
          )}
        </fieldset>

        <fieldset className="checkout__section" disabled={isPending}>
          <legend>Follow-up</legend>
          <div className="row">
            {FOLLOW_UP_PRESETS.map((preset) => {
              const date = addDays(appointment.date, preset.days);
              return (
                <Button
                  key={preset.days}
                  size="sm"
                  variant={followUpDate === date ? 'primary' : 'secondary'}
                  aria-pressed={followUpDate === date}
                  onClick={() => setFollowUpDate(followUpDate === date ? null : date)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          <Field
            label="Follow-up date"
            error={errors.followUpDate}
            hint={followUpDate ? formatDate(followUpDate) : 'Optional. Leave empty if no follow-up is needed.'}
          >
            {(control) => (
              <TextInput
                {...control}
                type="date"
                min={minFollowUp}
                value={followUpDate ?? ''}
                onChange={(e) => setFollowUpDate(e.target.value || null)}
              />
            )}
          </Field>
        </fieldset>

        <InlineError error={error} />
      </form>
    </Modal>
  );
}

import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, TextInput } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { InlineError } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import { useMutation } from '../../hooks/useMutation';
import { amountPaid, balanceDue } from '../../lib/billing';
import { formatCurrency, formatDate } from '../../lib/format';
import { appointmentService } from '../../services/appointmentService';
import type { AppointmentDetails, PaymentMethod } from '../../types/domain';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import './billing.css';

interface RecordPaymentModalProps {
  appointment: AppointmentDetails;
  onClose: () => void;
}

export function RecordPaymentModal({ appointment, onClose }: RecordPaymentModalProps) {
  const toast = useToast();
  const due = balanceDue(appointment);
  const [amount, setAmount] = useState(String(due));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amountError, setAmountError] = useState<string>();
  const { mutate, isPending, error } = useMutation(appointmentService.recordPayment);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) return setAmountError('Enter an amount greater than zero');
    if (value > due) return setAmountError(`Amount cannot exceed ${formatCurrency(due)}`);
    setAmountError(undefined);

    const result = await mutate(appointment.id, { amount: value, method });
    if (result.ok) {
      toast.success(`${formatCurrency(value)} received from ${appointment.patient.name}.`);
      onClose();
    }
  };

  return (
    <Modal
      title="Record payment"
      description={`${appointment.patient.name} · ${appointment.doctor.name} · ${formatDate(appointment.date)}`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      footer={
        <>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="record-payment-form" loading={isPending}>
            Record payment
          </Button>
        </>
      }
    >
      <form id="record-payment-form" className="stack" onSubmit={handleSubmit} noValidate>
        <dl className="bill-summary">
          <div>
            <dt>Consultation fee</dt>
            <dd>{formatCurrency(appointment.fee)}</dd>
          </div>
          <div>
            <dt>Already paid</dt>
            <dd>{formatCurrency(amountPaid(appointment))}</dd>
          </div>
          <div className="bill-summary__total">
            <dt>Balance due</dt>
            <dd>{formatCurrency(due)}</dd>
          </div>
        </dl>

        <Field label="Amount received" error={amountError} required>
          {(control) => (
            <TextInput
              {...control}
              type="number"
              inputMode="decimal"
              min={1}
              max={due}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoFocus
            />
          )}
        </Field>

        <div className="field">
          <span className="field__label">Payment method</span>
          <PaymentMethodPicker value={method} onChange={setMethod} />
        </div>

        <InlineError error={error} />
      </form>
    </Modal>
  );
}

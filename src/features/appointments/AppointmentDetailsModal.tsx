import { Link } from 'react-router-dom';
import { AsyncContent } from '../../components/ui/AsyncContent';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useQuery } from '../../hooks/useQuery';
import { amountPaid, balanceDue, hasOutstandingBalance } from '../../lib/billing';
import { dateOfTimestamp } from '../../lib/date';
import {
  formatCurrency,
  formatDate,
  formatPatientMeta,
  formatPaymentMethod,
  formatSlot,
  formatTime,
} from '../../lib/format';
import { appointmentService } from '../../services/appointmentService';
import type { AppointmentDetails, ID, ISODateTime } from '../../types/domain';
import { PaymentBadge } from '../billing/PaymentBadge';
import '../billing/billing.css';
import { PrescriptionView } from './PrescriptionView';
import { StatusBadge } from './StatusBadge';
import './appointments.css';

interface AppointmentDetailsModalProps {
  appointmentId: ID;
  onClose: () => void;
  onRecordPayment: (appointment: AppointmentDetails) => void;
}

function Timeline({ appointment }: { appointment: AppointmentDetails }) {
  const steps: Array<[string, ISODateTime | null]> = [
    ['Booked', appointment.createdAt],
    ['Checked in', appointment.checkedInAt],
    ['Consultation started', appointment.startedAt],
    ['Completed', appointment.completedAt],
    ['Cancelled', appointment.cancelledAt],
  ];
  return (
    <ol className="timeline">
      {steps
        .filter(([, at]) => at)
        .map(([label, at]) => (
          <li key={label}>
            <span>{label}</span>
            <span className="text-subtle tabular">{at && formatTime(at)}</span>
          </li>
        ))}
    </ol>
  );
}

export function AppointmentDetailsModal({ appointmentId, onClose, onRecordPayment }: AppointmentDetailsModalProps) {
  const query = useQuery(`appointment:${appointmentId}`, () => appointmentService.get(appointmentId));
  const appointment = query.data;

  return (
    <Modal
      title="Visit details"
      size="lg"
      onClose={onClose}
      footer={
        <>
          {appointment && (
            <Link to={`/patients/${appointment.patientId}`} className="btn btn--ghost btn--md details__patient-link">
              Open patient record
            </Link>
          )}
          <Button onClick={onClose}>Close</Button>
          {appointment && hasOutstandingBalance(appointment) && (
            <Button variant="primary" icon="wallet" onClick={() => onRecordPayment(appointment)}>
              Record payment
            </Button>
          )}
        </>
      }
    >
      <AsyncContent query={query} loadingLabel="Loading visit…">
        {(visit) => (
          <div className="details">
            <div className="details__patient">
              <Avatar name={visit.patient.name} size="lg" />
              <div>
                <p className="details__name">{visit.patient.name}</p>
                <p className="text-muted">
                  {formatPatientMeta(visit.patient)} · {visit.patient.phone}
                </p>
              </div>
              <StatusBadge status={visit.status} />
            </div>
            {visit.patient.allergies && <p className="allergy-note">Allergies: {visit.patient.allergies}</p>}

            <dl className="details__grid">
              <div>
                <dt>Doctor</dt>
                <dd>
                  {visit.doctor.name}
                  <span className="text-subtle"> · {visit.doctor.specialty}</span>
                </dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>
                  {formatDate(visit.date)}
                  {visit.time && ` · ${formatSlot(visit.time)}`}
                </dd>
              </div>
              <div>
                <dt>Token</dt>
                <dd>#{visit.token}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{visit.reason || '—'}</dd>
              </div>
              {visit.followUpDate && (
                <div>
                  <dt>Follow-up</dt>
                  <dd>{formatDate(visit.followUpDate)}</dd>
                </div>
              )}
            </dl>

            <section className="details__section">
              <h3>Timeline</h3>
              <Timeline appointment={visit} />
            </section>

            {visit.prescription && (
              <section className="details__section">
                <h3>Prescription</h3>
                <PrescriptionView prescription={visit.prescription} />
              </section>
            )}

            {visit.status === 'completed' && (
              <section className="details__section">
                <div className="details__section-head">
                  <h3>Billing</h3>
                  <PaymentBadge appointment={visit} />
                </div>
                <dl className="bill-summary">
                  <div>
                    <dt>Consultation fee</dt>
                    <dd>{formatCurrency(visit.fee)}</dd>
                  </div>
                  {visit.payments.map((payment) => (
                    <div key={payment.id}>
                      <dt>
                        {formatPaymentMethod(payment.method)} · {formatDate(dateOfTimestamp(payment.paidAt))}
                      </dt>
                      <dd>−{formatCurrency(payment.amount)}</dd>
                    </div>
                  ))}
                  <div className="bill-summary__total">
                    <dt>{balanceDue(visit) > 0 ? 'Balance due' : `Paid in full (${formatCurrency(amountPaid(visit))})`}</dt>
                    <dd>{formatCurrency(balanceDue(visit))}</dd>
                  </div>
                </dl>
              </section>
            )}
          </div>
        )}
      </AsyncContent>
    </Modal>
  );
}

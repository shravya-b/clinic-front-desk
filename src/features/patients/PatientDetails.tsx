import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AsyncContent } from '../../components/ui/AsyncContent';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { EmptyState } from '../../components/ui/States';
import { useQuery } from '../../hooks/useQuery';
import { hasOutstandingBalance } from '../../lib/billing';
import { dateOfTimestamp } from '../../lib/date';
import { formatCurrency, formatDate, formatPatientMeta, formatRelativeDay } from '../../lib/format';
import { patientService, type PatientSummary } from '../../services/patientService';
import type { AppointmentDetails, ID } from '../../types/domain';
import { BookAppointmentModal } from '../appointments/BookAppointmentModal';
import { StatusBadge } from '../appointments/StatusBadge';
import { useAppointmentActions, type AppointmentActionHandler } from '../appointments/useAppointmentActions';
import { PaymentBadge } from '../billing/PaymentBadge';
import { PatientFormModal } from './PatientFormModal';
import './patients.css';

function VisitHistory({ visits, onAction }: { visits: AppointmentDetails[]; onAction: AppointmentActionHandler }) {
  if (visits.length === 0) {
    return <EmptyState compact icon="calendar" title="No visits yet" description="Book an appointment to get started." />;
  }
  return (
    <ul className="visit-list">
      {visits.map((visit) => (
        <li key={visit.id} className="visit">
          <button type="button" className="visit__main" onClick={() => onAction('view', visit)}>
            <span className="visit__date">{formatRelativeDay(visit.date)}</span>
            <span className="visit__title">{visit.prescription?.diagnosis || visit.reason || 'Consultation'}</span>
            <span className="text-subtle">
              {visit.doctor.name} · Token #{visit.token}
            </span>
          </button>
          <div className="visit__aside">
            <StatusBadge status={visit.status} />
            {visit.status === 'completed' && <PaymentBadge appointment={visit} showBalance />}
            {hasOutstandingBalance(visit) && (
              <Button size="sm" icon="wallet" onClick={() => onAction('record_payment', visit)}>
                Collect
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PatientProfile({ patient, onEdit, onBook }: { patient: PatientSummary; onEdit: () => void; onBook: () => void }) {
  return (
    <Card>
      <div className="profile">
        <div className="profile__head">
          <Avatar name={patient.name} size="lg" />
          <div className="profile__title">
            <h2>{patient.name}</h2>
            <p className="text-muted">{formatPatientMeta(patient)}</p>
          </div>
          <div className="profile__actions">
            <Button icon="edit" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="primary" icon="plus" onClick={onBook}>
              Book appointment
            </Button>
          </div>
        </div>

        {patient.allergies && <p className="allergy-note">Allergies: {patient.allergies}</p>}

        <dl className="info-grid">
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${patient.phone}`}>
                <Icon name="phone" size={14} /> {patient.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{patient.email || '—'}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{patient.address || '—'}</dd>
          </div>
          <div>
            <dt>Visits</dt>
            <dd>{patient.visitCount}</dd>
          </div>
          <div>
            <dt>Balance due</dt>
            <dd className={patient.balanceDue > 0 ? 'text-danger' : undefined}>{formatCurrency(patient.balanceDue)}</dd>
          </div>
          <div>
            <dt>Registered</dt>
            <dd>{formatDate(dateOfTimestamp(patient.createdAt))}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

interface PatientDetailsProps {
  patientId: ID;
}

export function PatientDetails({ patientId }: PatientDetailsProps) {
  const patientQuery = useQuery(`patient:${patientId}`, () => patientService.get(patientId));
  const historyQuery = useQuery(`patient-history:${patientId}`, () => patientService.history(patientId));
  const { handleAction, dialogs } = useAppointmentActions();
  const [modal, setModal] = useState<'edit' | 'book' | null>(null);

  return (
    <div className="stack">
      <Link to="/patients" className="back-link">
        <Icon name="arrow-left" /> All patients
      </Link>

      <AsyncContent query={patientQuery} loadingLabel="Loading patient…" errorTitle="Couldn’t load this patient">
        {(patient) => (
          <>
            <PatientProfile patient={patient} onEdit={() => setModal('edit')} onBook={() => setModal('book')} />

            <Card title="Visit history" flush>
              <AsyncContent query={historyQuery} compact loadingLabel="Loading visits…">
                {(visits) => <VisitHistory visits={visits} onAction={handleAction} />}
              </AsyncContent>
            </Card>

            {modal === 'edit' && <PatientFormModal patient={patient} onClose={() => setModal(null)} />}
            {modal === 'book' && <BookAppointmentModal initialPatient={patient} onClose={() => setModal(null)} />}
          </>
        )}
      </AsyncContent>

      {dialogs}
    </div>
  );
}

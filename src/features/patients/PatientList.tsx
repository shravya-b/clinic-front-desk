import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { cx } from '../../lib/cx';
import { formatCurrency, formatPatientMeta, formatShortDate } from '../../lib/format';
import type { PatientSummary } from '../../services/patientService';
import type { ID } from '../../types/domain';
import './patients.css';

interface PatientListProps {
  patients: PatientSummary[];
  selectedId?: ID;
}

export function PatientList({ patients, selectedId }: PatientListProps) {
  return (
    <ul className="patient-list">
      {patients.map((patient) => (
        <li key={patient.id}>
          <Link
            to={`/patients/${patient.id}`}
            className={cx('patient-row', patient.id === selectedId && 'is-selected')}
            aria-current={patient.id === selectedId ? 'page' : undefined}
          >
            <Avatar name={patient.name} />
            <div className="patient-row__main">
              <p className="patient-row__name">{patient.name}</p>
              <p className="text-subtle">
                {formatPatientMeta(patient)} · {patient.phone}
              </p>
            </div>
            <div className="patient-row__aside">
              {patient.balanceDue > 0 && <Badge tone="danger">{formatCurrency(patient.balanceDue)} due</Badge>}
              <span className="text-subtle">
                {patient.lastVisit ? `Last visit ${formatShortDate(patient.lastVisit)}` : 'No visits yet'}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

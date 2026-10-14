import { useState } from 'react';
import { AsyncContent } from '../../components/ui/AsyncContent';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/Form';
import { EmptyState } from '../../components/ui/States';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useQuery } from '../../hooks/useQuery';
import { formatPatientMeta } from '../../lib/format';
import { patientService } from '../../services/patientService';
import type { Patient } from '../../types/domain';
import './patients.css';

const RESULT_LIMIT = 6;

interface PatientPickerProps {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
  /** Called with the current search text so the registration form can be prefilled. */
  onRegisterNew: (search: string) => void;
  error?: string;
}

/** Search-as-you-type patient finder with a shortcut to register someone new. */
export function PatientPicker({ value, onChange, onRegisterNew, error }: PatientPickerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const results = useQuery(
    `patient-picker:${debouncedSearch}`,
    () => patientService.list({ search: debouncedSearch, limit: RESULT_LIMIT }),
    { enabled: !value },
  );

  if (value) {
    return (
      <div className="patient-chip">
        <Avatar name={value.name} />
        <div className="patient-chip__text">
          <p className="patient-chip__name">{value.name}</p>
          <p className="text-subtle">
            {formatPatientMeta(value)} · {value.phone}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="patient-picker">
      <SearchInput
        label="Search patients by name or phone"
        placeholder="Search by name or phone…"
        value={search}
        onChange={setSearch}
        aria-invalid={error ? true : undefined}
        autoFocus
      />
      {error && <p className="field__message field__message--error">{error}</p>}

      <div className="patient-picker__results">
        <AsyncContent
          query={results}
          compact
          loadingLabel="Searching patients…"
          isEmpty={(patients) => patients.length === 0}
          empty={
            <EmptyState
              compact
              icon="search"
              title={debouncedSearch ? `No patients match “${debouncedSearch}”` : 'No patients yet'}
              description="Register them as a new patient to continue."
            />
          }
        >
          {(patients) => (
            <ul className="patient-picker__list" aria-label="Matching patients">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button type="button" className="patient-option" onClick={() => onChange(patient)}>
                    <Avatar name={patient.name} size="sm" />
                    <span className="patient-option__name">{patient.name}</span>
                    <span className="patient-option__meta">
                      {formatPatientMeta(patient)} · {patient.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AsyncContent>
      </div>

      <Button size="sm" variant="ghost" icon="user-plus" onClick={() => onRegisterNew(search.trim())}>
        Register new patient
      </Button>
    </div>
  );
}
